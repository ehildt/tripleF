import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { clampCognitionLimit } from '@triplef/agent/schemas';
import {
  clampEpisodeProbeLimit,
  clampEpisodeRecencyMidpoint,
  clampEpisodeRecencyScaleSeconds,
  clampEpisodeRecencyWeight,
  clampEpisodeScoreThreshold,
} from '@triplef/agent/schemas';
import { retryWithBackoff } from '@triplef/helpers/retry-with-backoff';

import { ENCYCLOPEDIA_CONFIG } from '../../encyclopedia/constants/encyclopedia.constants.js';
import type { EncyclopediaConfig } from '../../encyclopedia/models/encyclopedia-config.model.js';
import { ProviderOverridesRepository } from '../../persistence/services/provider-overrides.repository.js';
import { clampClusterMinMembers } from '../constants/cluster.constant.js';
import { clampConstellationNodeLimit } from '../constants/constellation-node-limit.constant.js';
import {
  clampConvictionBatchLimit,
  clampConvictionMaxPerCluster,
} from '../constants/conviction.constant.js';
import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import {
  clampReflectBatchLimit,
  clampReflectMaxCandidates,
} from '../constants/reflect.constant.js';
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

  /** Field name → clamp function for every numeric override. */
  private static readonly OVERRIDE_CLAMPS: Record<
    string,
    (value: number) => number
  > = {
    cognitionLimit: clampCognitionLimit,
    constellationNodeLimit: clampConstellationNodeLimit,
    episodeRecencyWeight: clampEpisodeRecencyWeight,
    episodeRecencyScaleSeconds: clampEpisodeRecencyScaleSeconds,
    episodeRecencyMidpoint: clampEpisodeRecencyMidpoint,
    episodeProbeLimit: clampEpisodeProbeLimit,
    episodeScoreThreshold: clampEpisodeScoreThreshold,
    reflectBatchLimit: clampReflectBatchLimit,
    reflectMaxCandidates: clampReflectMaxCandidates,
    convictionBatchLimit: clampConvictionBatchLimit,
    convictionMaxPerCluster: clampConvictionMaxPerCluster,
    clusterMinMembers: clampClusterMinMembers,
  };

  constructor(
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
    @Inject(ENCYCLOPEDIA_CONFIG)
    private readonly encyclopediaConfig: EncyclopediaConfig,
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
    // The row was written by persistOverrides from the already-validated
    // patch (the endpoint DTO + config Joi own the contract) — trust it.
    // The getters still fall back to the env baseline on any unexpected shape.
    this.overrides = values as MemoryOverridesPatch;
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

  /** Effective recency weight for the episode probe (0–1). */
  getEpisodeRecencyWeight(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.episodeRecencyWeight;
    return clampEpisodeRecencyWeight(
      typeof override === 'number'
        ? override
        : this.config.episodeRecencyWeight,
    );
  }

  /** Effective recency decay horizon in seconds (60–31536000). */
  getEpisodeRecencyScaleSeconds(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.episodeRecencyScaleSeconds;
    return clampEpisodeRecencyScaleSeconds(
      typeof override === 'number'
        ? override
        : this.config.episodeRecencyScaleSeconds,
    );
  }

  /** Effective recency decay midpoint (0.01–0.99). */
  getEpisodeRecencyMidpoint(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.episodeRecencyMidpoint;
    return clampEpisodeRecencyMidpoint(
      typeof override === 'number'
        ? override
        : this.config.episodeRecencyMidpoint,
    );
  }

  /** Effective episode probe limit (1–10 records per turn). */
  getEpisodeProbeLimit(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.episodeProbeLimit;
    return clampEpisodeProbeLimit(
      typeof override === 'number' ? override : this.config.episodeProbeLimit,
    );
  }

  /** Effective episode probe score threshold (0–1) — the recency prefetch noise floor. */
  getEpisodeScoreThreshold(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.episodeScoreThreshold;
    return clampEpisodeScoreThreshold(
      typeof override === 'number'
        ? override
        : this.config.episodeScoreThreshold,
    );
  }

  /** Effective constellation node-load limit (100–10000 records per space). */
  getConstellationNodeLimit(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.constellationNodeLimit;
    return clampConstellationNodeLimit(
      typeof override === 'number'
        ? override
        : this.config.constellationNodeLimit,
    );
  }

  /** Effective auto-trigger flag for partition reflection. */
  getPartitionReflectAutoEnabled(): boolean {
    this.scheduleLazyRestore();
    return (
      this.overrides.partitionReflectAutoEnabled ??
      this.config.partitionReflectAutoEnabled
    );
  }

  /** Effective auto-trigger flag for cognition reflection. */
  getCognitionReflectAutoEnabled(): boolean {
    this.scheduleLazyRestore();
    return (
      this.overrides.cognitionReflectAutoEnabled ??
      this.config.cognitionReflectAutoEnabled
    );
  }

  /** Effective auto-trigger flag for encyclopedia reflection. */
  getEncyclopediaReflectAutoEnabled(): boolean {
    this.scheduleLazyRestore();
    return (
      this.overrides.encyclopediaReflectAutoEnabled ??
      this.config.encyclopediaReflectAutoEnabled
    );
  }

  /** Effective reflection model (override → env baseline → undefined). */
  getReflectModel(): string | undefined {
    this.scheduleLazyRestore();
    return this.overrides.reflectModel ?? this.config.reflectModel;
  }

  /** Effective reflection batch limit (1–500 points per run). */
  getReflectBatchLimit(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.reflectBatchLimit;
    return clampReflectBatchLimit(
      typeof override === 'number' ? override : this.config.reflectBatchLimit,
    );
  }

  /** Effective reflection candidate pool (1–100 neighbors per point). */
  getReflectMaxCandidates(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.reflectMaxCandidates;
    return clampReflectMaxCandidates(
      typeof override === 'number'
        ? override
        : this.config.reflectMaxCandidates,
    );
  }

  /** Effective conviction-synthesis model (override → env baseline → undefined). */
  getConvictionModel(): string | undefined {
    this.scheduleLazyRestore();
    return this.overrides.convictionModel ?? this.config.convictionModel;
  }

  /** Effective conviction-synthesis batch limit (1–500 evidence points per run). */
  getConvictionBatchLimit(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.convictionBatchLimit;
    return clampConvictionBatchLimit(
      typeof override === 'number'
        ? override
        : this.config.convictionBatchLimit,
    );
  }

  /** Effective conviction-synthesis output cap (1–1000 convictions per run). */
  getConvictionMaxPerCluster(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.convictionMaxPerCluster;
    return clampConvictionMaxPerCluster(
      typeof override === 'number'
        ? override
        : this.config.convictionMaxPerCluster,
    );
  }

  /** Effective auto-trigger flag for conviction synthesis. */
  getConvictionAutoEnabled(): boolean {
    this.scheduleLazyRestore();
    return (
      this.overrides.convictionAutoEnabled ?? this.config.convictionAutoEnabled
    );
  }

  /** Effective cluster-detection model (override → env baseline → undefined). */
  getClusterModel(): string | undefined {
    this.scheduleLazyRestore();
    return this.overrides.clusterModel ?? this.config.clusterModel;
  }

  /** Effective minimum members for a structural cluster (1–100). */
  getClusterMinMembers(): number {
    this.scheduleLazyRestore();
    const override = this.overrides.clusterMinMembers;
    return clampClusterMinMembers(
      typeof override === 'number' ? override : this.config.clusterMinMembers,
    );
  }

  /** Effective auto-trigger flag for cluster detection. */
  getClusterAutoEnabled(): boolean {
    this.scheduleLazyRestore();
    return this.overrides.clusterAutoEnabled ?? this.config.clusterAutoEnabled;
  }

  /** Effective consolidation model (override → env baseline → undefined). */
  getConsolidateModel(): string | undefined {
    this.scheduleLazyRestore();
    return this.overrides.consolidateModel ?? this.config.consolidateModel;
  }

  /** Effective encyclopedia classification model (override → env baseline → undefined). */
  getClassifyModel(): string | undefined {
    this.scheduleLazyRestore();
    return (
      this.overrides.classifyModel ?? this.encyclopediaConfig.classifyModel
    );
  }

  /** The SysCtl read view: effective values plus the env baseline + bounds. */
  getConfig() {
    return {
      cognitionLimit: this.getCognitionLimit(),
      baseline: this.config.cognitionLimit,
      overridden: this.overrides.cognitionLimit !== undefined,
      episodeRecencyWeight: this.getEpisodeRecencyWeight(),
      episodeRecencyScaleSeconds: this.getEpisodeRecencyScaleSeconds(),
      episodeRecencyMidpoint: this.getEpisodeRecencyMidpoint(),
      episodeProbeLimit: this.getEpisodeProbeLimit(),
      episodeScoreThreshold: this.getEpisodeScoreThreshold(),
      constellationNodeLimit: this.getConstellationNodeLimit(),
      consolidateModel: this.getConsolidateModel(),
      classifyModel: this.getClassifyModel(),
      partitionReflectAutoEnabled: this.getPartitionReflectAutoEnabled(),
      cognitionReflectAutoEnabled: this.getCognitionReflectAutoEnabled(),
      encyclopediaReflectAutoEnabled: this.getEncyclopediaReflectAutoEnabled(),
      reflectModel: this.getReflectModel(),
      reflectBatchLimit: this.getReflectBatchLimit(),
      reflectMaxCandidates: this.getReflectMaxCandidates(),
      convictionModel: this.getConvictionModel(),
      convictionBatchLimit: this.getConvictionBatchLimit(),
      convictionMaxPerCluster: this.getConvictionMaxPerCluster(),
      convictionAutoEnabled: this.getConvictionAutoEnabled(),
      clusterModel: this.getClusterModel(),
      clusterMinMembers: this.getClusterMinMembers(),
      clusterAutoEnabled: this.getClusterAutoEnabled(),
    };
  }

  updateConfig(patch: MemoryOverridesPatch): void {
    this.restored = true;
    const next: MemoryOverridesPatch = { ...this.overrides };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (value === null) {
        delete next[key as keyof MemoryOverridesPatch];
        continue;
      }
      const clamp = MemoryOverridesService.OVERRIDE_CLAMPS[key];
      (next as Record<string, unknown>)[key] = clamp ? clamp(value) : value;
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
    for (const [key, value] of Object.entries(this.overrides)) {
      if (value !== undefined) values[key] = value;
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
