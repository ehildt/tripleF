import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';

import { ProviderOverridesRepository } from '../../persistence/services/provider-overrides.repository.js';
import { retryWithBackoff } from '../../provider-overrides/helpers/retry-with-backoff.helper.js';
import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import { clampCognitionLimit } from '../models/memory-cognition.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import type { MemoryOverridesPatch } from './memory-overrides.service.types.js';

const MEMORY_PROVIDER_KEY = 'memory';

/** Boot restore: 5 attempts, 500ms → 8s backoff — spans compose cold starts. */
const BOOT_RESTORE_ATTEMPTS = 5;
/** Minimum pause between lazy restore attempts after a failed boot restore. */
const LAZY_RESTORE_THROTTLE_MS = 10_000;

/**
 * Memory system variables (sysctl → system) layered over the env-backed
 * defaults (`MEMORY_COGNITION_LIMIT`, …). Consumers resolve the effective
 * value at execution time, so a SysCtl write takes effect on the very next
 * request without a restart. Overrides are persisted globally — system
 * settings, not user/session data — via the shared provider-overrides store
 * and restored on boot; env vars remain the baseline when nothing is
 * persisted.
 */
@Injectable()
export class MemoryOverridesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MemoryOverridesService.name);
  private overrides: MemoryOverridesPatch = {};
  /** True once the persistent row has been read (or live overrides written). */
  private restored = false;
  private lastRestoreAttemptAt = 0;
  private restoreInFlight?: Promise<void>;

  constructor(
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
    private readonly repository: ProviderOverridesRepository,
  ) {}

  async onApplicationBootstrap() {
    try {
      await retryWithBackoff(() => this.attemptRestore(), {
        attempts: BOOT_RESTORE_ATTEMPTS,
      });
    } catch (error) {
      this.logger.warn(
        `Memory overrides could not be loaded (staying in-memory, retrying lazily on use): ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /** Single restore attempt: read and apply the persisted row. */
  private async attemptRestore(): Promise<void> {
    this.lastRestoreAttemptAt = Date.now();
    const rows = await this.repository.findAll();
    // A live SysCtl write landed mid-flight — it is fresher than any row.
    if (this.restored) return;
    this.restored = true;
    const values = rows.find(
      (entry) => entry.provider === MEMORY_PROVIDER_KEY,
    )?.values;
    if (!values || typeof values !== 'object') return;
    const record = values as Record<string, unknown>;
    const patch: MemoryOverridesPatch = {};
    if (typeof record.cognitionLimit === 'number') {
      patch.cognitionLimit = clampCognitionLimit(record.cognitionLimit);
    }
    this.overrides = patch;
  }

  /**
   * After a failed boot restore the first getter call re-attempts, throttled,
   * so a slow database never silently pins the env baseline forever.
   */
  private scheduleLazyRestore(): void {
    if (this.restored || this.restoreInFlight) return;
    if (Date.now() - this.lastRestoreAttemptAt < LAZY_RESTORE_THROTTLE_MS)
      return;
    this.restoreInFlight = this.attemptRestore().catch((error) => {
      this.logger.debug(
        `Lazy restore of memory overrides failed: ${error instanceof Error ? error.message : error}`,
      );
    });
  }

  /**
   * The effective cognition profile character cap (serialized JSON size):
   * override → env baseline → built-in default, always clamped into the
   * supported envelope.
   */
  getCognitionLimit(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.cognitionLimit;
    return clampCognitionLimit(
      typeof override === 'number' ? override : this.config.cognitionLimit,
    );
  }

  /** The SysCtl read view: effective values plus the env baseline + bounds. */
  getConfig() {
    return {
      cognitionLimit: this.getCognitionLimit(),
      baseline: this.config.cognitionLimit,
      overridden: this.overrides.cognitionLimit !== undefined,
    };
  }

  updateConfig(patch: MemoryOverridesPatch): void {
    this.restored = true;
    const next: MemoryOverridesPatch = { ...this.overrides };
    if (patch.cognitionLimit !== undefined) {
      if (typeof patch.cognitionLimit === 'number') {
        next.cognitionLimit = clampCognitionLimit(patch.cognitionLimit);
      } else if (patch.cognitionLimit === null) {
        delete next.cognitionLimit;
      }
    }
    this.overrides = next;
    this.persistOverrides();
  }

  /** Drop all overrides — effective values fall back to the env defaults. */
  resetConfig() {
    this.restored = true;
    this.overrides = {};
    void this.repository.deleteByProvider(MEMORY_PROVIDER_KEY);
    return this.getConfig();
  }

  /**
   * Persist the overrides row. Fire-and-forget: a database hiccup must not
   * break the in-memory flow — the next successful write repairs the row.
   */
  private persistOverrides(): void {
    const values: Record<string, unknown> = {};
    if (this.overrides.cognitionLimit !== undefined) {
      values.cognitionLimit = this.overrides.cognitionLimit;
    }
    if (Object.keys(values).length === 0) {
      void this.repository.deleteByProvider(MEMORY_PROVIDER_KEY);
      return;
    }
    void this.repository.upsert(MEMORY_PROVIDER_KEY, values).catch((error) => {
      this.logger.warn(
        `Failed to persist memory overrides: ${error instanceof Error ? error.message : error}`,
      );
    });
  }
}
