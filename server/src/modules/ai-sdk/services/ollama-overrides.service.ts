import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { ProviderOverridesRepository } from '../../persistence/services/provider-overrides.repository.js';
import {
  isMaskedApiKey,
  maskApiKey,
} from '../../provider-overrides/helpers/mask-api-key.helper.js';
import { retryWithBackoff } from '../../provider-overrides/helpers/retry-with-backoff.helper.js';
import { SecretsCipherService } from '../../secrets/services/secrets-cipher.service.js';
import { OllamaConfigService } from '../configs/ollama-config.service.js';

import type {
  OllamaConnectionConfig,
  OllamaOverridesPatch,
} from './ollama-overrides.service.types.js';

const OLLAMA_PROVIDER_KEY = 'ollama';

/** Boot restore: 5 attempts, 500ms → 8s backoff — spans compose cold starts. */
const BOOT_RESTORE_ATTEMPTS = 5;
/** Minimum pause between lazy restore attempts after a failed boot restore. */
const LAZY_RESTORE_THROTTLE_MS = 10_000;

/**
 * Ollama connection overrides layered over the env-backed defaults. The
 * SysCtl system tab writes patches here; consumers resolve the effective
 * connection at execution time, so the next request always uses the latest
 * settings. Overrides are persisted in the database with the API key
 * encrypted (see SecretsCipherService) and restored on boot; env vars
 * remain the baseline when nothing is persisted.
 */
@Injectable()
export class OllamaOverridesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OllamaOverridesService.name);
  private overrides: OllamaOverridesPatch = {};
  /** True once the database row has been read (or live overrides written). */
  private restored = false;
  private lastRestoreAttemptAt = 0;
  private restoreInFlight?: Promise<void>;

  constructor(
    private readonly ollamaCfg: OllamaConfigService,
    private readonly repository: ProviderOverridesRepository,
    private readonly cipher: SecretsCipherService,
  ) {}

  /**
   * Restore the persisted ollama override (decrypting the API key) with
   * bounded backoff so a database that is still warming up at boot does
   * not leave the service keyless. A later failure is no longer final:
   * getConfig() re-attempts the restore, throttled, until it succeeds.
   */
  async onApplicationBootstrap() {
    try {
      await retryWithBackoff(() => this.attemptRestore(), {
        attempts: BOOT_RESTORE_ATTEMPTS,
      });
    } catch (error) {
      this.logger.warn(
        `Ollama overrides could not be loaded (staying in-memory, retrying lazily on use): ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Single restore attempt: read and apply the persisted row. Throws when
   * the database is unreachable so the caller can retry.
   */
  private async attemptRestore(): Promise<void> {
    this.lastRestoreAttemptAt = Date.now();
    const rows = await this.repository.findAll();
    // A live SysCtl write landed mid-flight — it is fresher than any row.
    if (this.restored) return;
    this.restored = true;
    const row = rows.find((entry) => entry.provider === OLLAMA_PROVIDER_KEY);
    const values = row?.values;
    if (!values || typeof values !== 'object') return;
    const record = values as Record<string, unknown>;
    const { apiKey, ...rest } = record;
    this.overrides = { ...(rest as OllamaOverridesPatch) };
    if (typeof apiKey === 'string' && apiKey) {
      const decrypted = this.cipher.decrypt(apiKey);
      if (decrypted) this.overrides.apiKey = decrypted;
      if (decrypted && this.cipher.needsReEncryption(apiKey)) {
        this.persistOverrides();
        this.logger.log(
          'Re-encrypted the persisted ollama API key with the active secrets key',
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
          'Ollama overrides restored from the database after a failed boot restore',
        );
      })
      .catch((error) => {
        this.logger.debug(
          `Lazy restore of ollama overrides failed: ${error instanceof Error ? error.message : error}`,
        );
      })
      .finally(() => {
        this.restoreInFlight = undefined;
      });
  }

  /**
   * The effective connection with the real API key. For internal consumers
   * only (model calls, catalog, health) — never expose this to clients.
   */
  getConfig(): OllamaConnectionConfig {
    this.scheduleLazyRestore();
    return {
      host:
        this.overrides.host ??
        this.ollamaCfg.config.host ??
        'http://127.0.0.1:11434/api',
      apiKey: this.overrides.apiKey ?? this.ollamaCfg.config.apiKey,
    };
  }

  /**
   * The effective connection with the API key masked (****************).
   * This is the only connection form that may leave the server.
   */
  getMaskedConfig(): OllamaConnectionConfig {
    const config = this.getConfig();
    return { host: config.host, apiKey: maskApiKey(config.apiKey) };
  }

  updateConfig(patch: OllamaOverridesPatch): void {
    // Live overrides are fresher than any persisted row — never restore over them.
    this.restored = true;
    const host = patch.host?.trim();
    if (host) this.overrides.host = host.replace(/\/+$/, '');
    if (patch.apiKey !== undefined) this.updateApiKeyOverride(patch.apiKey);
    this.persistOverrides();
  }

  /**
   * Drop all overrides — the effective connection falls back to the
   * pristine env defaults (including the env API key).
   */
  resetConfig(): OllamaConnectionConfig {
    this.restored = true;
    this.overrides = {};
    void this.repository.deleteByProvider(OLLAMA_PROVIDER_KEY);
    return this.getMaskedConfig();
  }

  /**
   * Persist the overrides with the API key encrypted. Fire-and-forget:
   * a database hiccup must not break the in-memory override flow.
   */
  private persistOverrides(): void {
    if (Object.keys(this.overrides).length === 0) {
      void this.repository.deleteByProvider(OLLAMA_PROVIDER_KEY);
      return;
    }
    const { apiKey, ...rest } = this.overrides;
    const values: Record<string, unknown> = { ...rest };
    if (apiKey) {
      const encrypted = this.cipher.encrypt(apiKey);
      if (encrypted) values.apiKey = encrypted;
    }
    void this.repository.upsert(OLLAMA_PROVIDER_KEY, values).catch((error) => {
      this.logger.warn(
        `Failed to persist ollama overrides: ${error instanceof Error ? error.message : error}`,
      );
    });
  }

  /**
   * API key patch rules: a masked-looking value is ignored (it is the
   * display form, not a key); an empty value clears the override so the
   * env key applies again; anything else becomes the new override.
   */
  private updateApiKeyOverride(value: unknown): void {
    if (isMaskedApiKey(value)) return;
    if (typeof value === 'string' && value.trim() === '') {
      delete this.overrides.apiKey;
      return;
    }
    if (typeof value === 'string') {
      this.overrides.apiKey = value.trim();
    }
  }
}
