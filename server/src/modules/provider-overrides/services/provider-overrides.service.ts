import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { ProviderOverridesRepository } from '../../persistence/services/provider-overrides.repository.js';
import { SecretsCipherService } from '../../secrets/services/secrets-cipher.service.js';
import type { SerperConfig } from '../configs/serper-config.adapter.js';
import { SerperConfigService } from '../configs/serper-config.service.js';
import type { SourcesConfig } from '../configs/sources-config.adapter.js';
import { SourcesConfigService } from '../configs/sources-config.service.js';
import { decryptOverridesSecrets } from '../helpers/decrypt-overrides-secrets.helper.js';
import { encryptOverridesSecrets } from '../helpers/encrypt-overrides-secrets.helper.js';
import { isMaskedApiKey, maskApiKey } from '../helpers/mask-api-key.helper.js';
import { retryWithBackoff } from '../helpers/retry-with-backoff.helper.js';

export interface ProviderOverridesSnapshot {
  serper: SerperConfig;
  sources: SourcesConfig;
}

/** Boot restore: 5 attempts, 500ms → 8s backoff — spans compose cold starts. */
const BOOT_RESTORE_ATTEMPTS = 5;
/** Minimum pause between lazy restore attempts after a failed boot restore. */
const LAZY_RESTORE_THROTTLE_MS = 10_000;

@Injectable()
export class ProviderOverridesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProviderOverridesService.name);
  private snapshot: ProviderOverridesSnapshot;
  private overrides: Record<string, any> = {};
  /** True once the database rows have been read (or live overrides written). */
  private restored = false;
  private lastRestoreAttemptAt = 0;
  private restoreInFlight?: Promise<void>;

  constructor(
    private readonly serperCfg: SerperConfigService,
    private readonly sourcesCfg: SourcesConfigService,
    private readonly repository: ProviderOverridesRepository,
    private readonly cipher: SecretsCipherService,
  ) {
    this.snapshot = {
      serper: this.serperCfg.config,
      sources: this.sourcesCfg.config,
    };
  }

  /**
   * Restore persisted overrides from the database, decrypting the API keys
   * with the secrets cipher, with bounded backoff so a database that is
   * still warming up at boot does not leave the service keyless. A later
   * failure is no longer final: getConfig() re-attempts the restore,
   * throttled, until it succeeds. Rows written with a retired key are
   * re-encrypted with the active key in the same pass (lazy rotation).
   */
  async onApplicationBootstrap() {
    try {
      await retryWithBackoff(() => this.attemptRestore(), {
        attempts: BOOT_RESTORE_ATTEMPTS,
      });
    } catch (error) {
      this.logger.warn(
        `Provider overrides could not be loaded (staying in-memory, retrying lazily on use): ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Single restore attempt: read and apply all persisted rows. Throws when
   * the database is unreachable so the caller can retry.
   */
  private async attemptRestore(): Promise<void> {
    this.lastRestoreAttemptAt = Date.now();
    const rows = await this.repository.findAll();
    // A live SysCtl write landed mid-flight — it is fresher than any row.
    if (this.restored) return;
    this.restored = true;
    for (const row of rows) {
      const values = row.values;
      if (!values || typeof values !== 'object') continue;
      const record = values as Record<string, unknown>;
      // Legacy key from before the webpageFetch → scrape rename.
      if ('webpageFetch' in record && !('scrape' in record)) {
        record.scrape = record.webpageFetch;
      }
      delete record.webpageFetch;
      const decrypted = decryptOverridesSecrets(
        { [row.provider]: record },
        (payload) => this.cipher.decrypt(payload),
      )[row.provider];
      this.overrides[row.provider] = decrypted;
      const persistedKey = record.apiKey;
      if (
        typeof persistedKey === 'string' &&
        this.cipher.needsReEncryption(persistedKey) &&
        typeof decrypted.apiKey === 'string'
      ) {
        this.persistProvider(row.provider);
        this.logger.log(
          `Re-encrypted the persisted ${row.provider} API key with the active secrets key`,
        );
      }
    }
  }

  /**
   * Fire-and-forget re-restore after a failed boot restore. Throttled and
   * single-flighted so per-request getConfig() calls never hammer the
   * database; a successful attempt restores the overrides for all later
   * calls. Skipped once overrides exist — live SysCtl edits are fresher
   * than any persisted row.
   */
  private scheduleLazyRestore(): void {
    if (this.restored || this.restoreInFlight) return;
    if (Date.now() - this.lastRestoreAttemptAt < LAZY_RESTORE_THROTTLE_MS)
      return;
    this.restoreInFlight = this.attemptRestore()
      .then(() => {
        this.logger.log(
          'Provider overrides restored from the database after a failed boot restore',
        );
      })
      .catch((error) => {
        this.logger.debug(
          `Lazy restore of provider overrides failed: ${error instanceof Error ? error.message : error}`,
        );
      })
      .finally(() => {
        this.restoreInFlight = undefined;
      });
  }

  /**
   * The effective config with overrides applied, including the real API key.
   * For internal consumers only (tools, intent classification) — never
   * expose this to clients.
   */
  getConfig(): ProviderOverridesSnapshot {
    this.scheduleLazyRestore();
    return this.applyOverrides(this.snapshot);
  }

  /**
   * The effective config with the API key masked (abcd********wxyz).
   * This is the only config form that may leave the server.
   */
  getMaskedConfig(): ProviderOverridesSnapshot {
    const config = this.getConfig();
    return {
      ...config,
      serper: {
        ...config.serper,
        apiKey: maskApiKey(config.serper.apiKey),
      },
    };
  }

  /**
   * Drop all overrides of one provider — the effective config falls back
   * to the pristine env defaults (including the env API key).
   */
  resetConfig(provider: string): void {
    // Live overrides are fresher than any persisted row — never restore over them.
    this.restored = true;
    delete this.overrides[provider];
    void this.repository.deleteByProvider(provider);
  }

  updateConfig(patch: Partial<Record<string, Record<string, any>>>): void {
    this.restored = true;
    for (const [provider, values] of Object.entries(patch)) {
      if (!values) continue;
      if (!this.overrides[provider]) {
        this.overrides[provider] = {};
      }
      for (const [key, val] of Object.entries(values)) {
        if (key === 'apiKey') {
          this.updateApiKeyOverride(provider, val);
          continue;
        }
        this.overrides[provider][key] = val;
      }
      this.persistProvider(provider);
    }
  }

  /**
   * Persist one provider's overrides record with its API key encrypted.
   * Fire-and-forget: a database hiccup must not break the in-memory
   * override flow — the next successful write repairs the row.
   */
  private persistProvider(provider: string): void {
    const entry = this.overrides[provider];
    if (!entry || Object.keys(entry).length === 0) {
      void this.repository.deleteByProvider(provider);
      return;
    }
    const values = encryptOverridesSecrets({ [provider]: entry }, (plaintext) =>
      this.cipher.encrypt(plaintext),
    )[provider];
    void this.repository.upsert(provider, values).catch((error) => {
      this.logger.warn(
        `Failed to persist ${provider} overrides: ${error instanceof Error ? error.message : error}`,
      );
    });
  }

  /**
   * API key patch rules: a masked-looking value is ignored (it is the
   * display form, not a key); an empty value clears the override so the
   * env key applies again; anything else becomes the new override.
   */
  private updateApiKeyOverride(provider: string, value: unknown): void {
    if (isMaskedApiKey(value)) return;
    if (typeof value === 'string' && value.trim() === '') {
      delete this.overrides[provider].apiKey;
      return;
    }
    if (typeof value === 'string') {
      this.overrides[provider].apiKey = value.trim();
    }
  }

  private applyOverrides(
    snapshot: ProviderOverridesSnapshot,
  ): ProviderOverridesSnapshot {
    // Deep-copy the provider configs first — merging into the shared
    // snapshot object would permanently pollute the pristine env config.
    const result: ProviderOverridesSnapshot = {
      serper: { ...snapshot.serper },
      sources: { ...snapshot.sources },
    };
    for (const [provider, values] of Object.entries(this.overrides)) {
      if (!(provider in result)) continue;
      const target = result[
        provider as keyof ProviderOverridesSnapshot
      ] as Record<string, any>;
      for (const [key, val] of Object.entries(values)) {
        target[key] = val;
      }
    }
    return result;
  }
}
