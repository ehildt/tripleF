import { retryWithBackoff } from '@triplef/helpers/retry-with-backoff';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EncyclopediaConfig } from '../../encyclopedia/models/encyclopedia-config.model.js';
import type { ProviderOverridesRepository } from '../../persistence/services/provider-overrides.repository.js';
import type { ResearchConfig } from '../../research/models/research-config.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { MemoryOverridesService } from './memory-overrides.service.js';

vi.mock('@triplef/helpers/retry-with-backoff', () => ({
  retryWithBackoff: vi.fn((task: () => Promise<unknown>) => task()),
}));

const retryMock = vi.mocked(retryWithBackoff);

const baselineConfig = {
  cognitionLimit: 5000,
  constellationNodeLimit: 5000,
  episodeRecencyWeight: 0.3,
  episodeRecencyScaleSeconds: 86_400,
  episodeRecencyMidpoint: 0.5,
  episodeProbeLimit: 5,
  episodeScoreThreshold: 0.3,
  consolidateModel: 'baseline-consolidate',
  reflectModel: 'baseline-reflect',
  reflectBatchLimit: 100,
  reflectMaxCandidates: 5,
  convictionModel: 'baseline-conviction',
  convictionBatchLimit: 100,
  convictionMaxPerCluster: 50,
  convictionAutoEnabled: false,
  clusterModel: 'baseline-cluster',
  clusterMinMembers: 3,
  raptorEnabled: true,
  heatTrackingEnabled: true,
  raptorMaxDepth: 2,
  clusterAutoEnabled: true,
  partitionReflectAutoEnabled: true,
  cognitionReflectAutoEnabled: true,
  encyclopediaReflectAutoEnabled: true,
} as unknown as QdrantConfig;

const baselineEncyclopedia = {
  classifyModel: 'baseline-classify',
} as unknown as EncyclopediaConfig;

const baselineResearch = {
  enabled: false,
  searchEnabled: false,
  provider: 'serper',
  model: 'baseline-research',
  gapLimit: 10,
  maxDepth: 3,
  fetchBudget: 5,
  frictionLimit: 5,
} as unknown as ResearchConfig;

const buildRepository = () =>
  ({
    findAll: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue({}),
    deleteByProvider: vi.fn().mockResolvedValue(null),
  }) as unknown as ProviderOverridesRepository;

const buildService = () => {
  const repository = buildRepository();
  const service = new MemoryOverridesService(
    baselineConfig,
    baselineEncyclopedia,
    baselineResearch,
    repository,
  );

  return { service, repository };
};

/** Let the fire-and-forget persist promise settle. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('MemoryOverridesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Faithful retry loop: the real helper re-runs the task until it succeeds
    // or the attempt budget is spent. Delays are irrelevant here.
    retryMock.mockImplementation((async (
      task: () => Promise<unknown>,
      options?: { attempts?: number },
    ) => {
      let lastError: unknown;
      for (let attempt = 0; attempt < (options?.attempts ?? 3); attempt += 1) {
        try {
          return await task();
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError;
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('env baseline', () => {
    it('exposes the env values when nothing is persisted', async () => {
      const { service } = buildService();

      await service.onApplicationBootstrap();

      expect(service.getConfig()).toMatchObject({
        cognitionLimit: 5000,
        episodeProbeLimit: 5,
        reflectBatchLimit: 100,
        raptorMaxDepth: 2,
        reflectModel: 'baseline-reflect',
        classifyModel: 'baseline-classify',
        researchProvider: 'serper',
        researchEnabled: false,
      });
    });

    it('reports whether a value is overridden', async () => {
      const { service } = buildService();
      await service.onApplicationBootstrap();

      expect(service.getConfig().overridden).toBe(false);

      service.updateConfig({ cognitionLimit: 8000 });

      expect(service.getConfig().overridden).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('clamps numeric overrides into the supported envelope', async () => {
      const { service } = buildService();
      await service.onApplicationBootstrap();

      service.updateConfig({
        cognitionLimit: 1,
        constellationNodeLimit: 99_999,
        reflectBatchLimit: 0,
        reflectMaxCandidates: 500,
        clusterMinMembers: 500,
        raptorMaxDepth: 9,
        researchGapLimit: 0,
        researchMaxDepth: 99,
        researchFetchBudget: 500,
        researchFrictionLimit: 0,
        episodeRecencyWeight: 5,
      });

      const config = service.getConfig();
      expect(config.cognitionLimit).toBe(500);
      expect(config.constellationNodeLimit).toBe(10_000);
      expect(config.reflectBatchLimit).toBe(1);
      expect(config.reflectMaxCandidates).toBe(100);
      expect(config.clusterMinMembers).toBe(100);
      expect(config.raptorMaxDepth).toBe(3);
      expect(config.researchGapLimit).toBe(1);
      expect(config.researchMaxDepth).toBe(3);
      expect(config.researchFetchBudget).toBe(20);
      expect(config.researchFrictionLimit).toBe(1);
      expect(config.episodeRecencyWeight).toBe(1);
    });

    it('applies string and boolean overrides verbatim', async () => {
      const { service } = buildService();
      await service.onApplicationBootstrap();

      service.updateConfig({
        reflectModel: 'override-reflect',
        clusterModel: 'override-cluster',
        classifyModel: 'override-classify',
        researchModel: 'override-research',
        researchProvider: 'bright-data',
        raptorEnabled: false,
        heatTrackingEnabled: false,
        convictionAutoEnabled: true,
      });

      const config = service.getConfig();
      expect(config.reflectModel).toBe('override-reflect');
      expect(config.clusterModel).toBe('override-cluster');
      expect(config.classifyModel).toBe('override-classify');
      expect(config.researchProvider).toBe('bright-data');
      expect(config.raptorEnabled).toBe(false);
      expect(config.heatTrackingEnabled).toBe(false);
      expect(config.convictionAutoEnabled).toBe(true);
    });

    it('ignores an unknown research provider and keeps the baseline', async () => {
      const { service } = buildService();
      await service.onApplicationBootstrap();

      service.updateConfig({ researchProvider: 'duckduckgo' });

      expect(service.getConfig().researchProvider).toBe('serper');
    });

    it('skips undefined patch fields', async () => {
      const { service } = buildService();
      await service.onApplicationBootstrap();
      service.updateConfig({ cognitionLimit: 8000 });

      service.updateConfig({ cognitionLimit: undefined });

      expect(service.getConfig().cognitionLimit).toBe(8000);
    });

    it('clears an override when null is passed', async () => {
      const { service } = buildService();
      await service.onApplicationBootstrap();
      service.updateConfig({ cognitionLimit: 8000, reflectModel: 'override' });

      service.updateConfig({ cognitionLimit: null, reflectModel: null });

      expect(service.getConfig().cognitionLimit).toBe(5000);
      expect(service.getConfig().reflectModel).toBe('baseline-reflect');
      expect(service.getConfig().overridden).toBe(false);
    });

    it('persists the override row for the memory provider', async () => {
      const { service, repository } = buildService();
      await service.onApplicationBootstrap();

      service.updateConfig({ cognitionLimit: 8000 });
      await flush();

      expect(repository.upsert).toHaveBeenCalledWith('memory', {
        cognitionLimit: 8000,
      });
    });

    it('deletes the row when the last override is cleared', async () => {
      const { service, repository } = buildService();
      await service.onApplicationBootstrap();
      service.updateConfig({ cognitionLimit: 8000 });

      service.updateConfig({ cognitionLimit: null });
      await flush();

      expect(repository.deleteByProvider).toHaveBeenCalledWith('memory');
    });

    it('keeps working in memory when persisting fails', async () => {
      const { service, repository } = buildService();
      await service.onApplicationBootstrap();
      vi.mocked(repository.upsert).mockRejectedValueOnce(new Error('db down'));

      service.updateConfig({ cognitionLimit: 8000 });
      await flush();

      expect(service.getConfig().cognitionLimit).toBe(8000);
    });
  });

  describe('resetConfig', () => {
    it('drops every override and falls back to the baseline', async () => {
      const { service, repository } = buildService();
      await service.onApplicationBootstrap();
      service.updateConfig({ cognitionLimit: 8000, raptorEnabled: false });

      const config = service.resetConfig();
      await flush();

      expect(config.cognitionLimit).toBe(5000);
      expect(config.raptorEnabled).toBe(true);
      expect(repository.deleteByProvider).toHaveBeenCalledWith('memory');
    });
  });

  describe('restore', () => {
    it('applies the persisted row on boot', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockResolvedValue([
        { provider: 'memory', values: { cognitionLimit: 9000 } },
      ] as never);

      await service.onApplicationBootstrap();

      expect(service.getConfig().cognitionLimit).toBe(9000);
    });

    it('clamps persisted values through the getters', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockResolvedValue([
        { provider: 'memory', values: { cognitionLimit: 999_999 } },
      ] as never);

      await service.onApplicationBootstrap();

      expect(service.getConfig().cognitionLimit).toBe(32_000);
    });

    it('ignores rows of other providers', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockResolvedValue([
        { provider: 'serper', values: { cognitionLimit: 9000 } },
      ] as never);

      await service.onApplicationBootstrap();

      expect(service.getConfig().cognitionLimit).toBe(5000);
    });

    it('ignores a row whose values are not an object', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockResolvedValue([
        { provider: 'memory', values: null },
      ] as never);

      await service.onApplicationBootstrap();

      expect(service.getConfig().cognitionLimit).toBe(5000);
    });

    it('keeps the in-memory values when the boot restore fails', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockRejectedValue(new Error('db down'));

      await service.onApplicationBootstrap();

      expect(retryMock).toHaveBeenCalledWith(expect.any(Function), {
        attempts: 5,
      });
      expect(service.getConfig().cognitionLimit).toBe(5000);
      expect(vi.mocked(repository.findAll).mock.calls.length).toBeGreaterThan(
        1,
      );
    });

    it('does not overwrite a live override with a late restore', async () => {
      const { service, repository } = buildService();
      let releaseRows: (rows: unknown[]) => void = () => undefined;
      vi.mocked(repository.findAll).mockImplementation(
        () =>
          new Promise((resolve) => {
            releaseRows = resolve;
          }) as never,
      );

      service.updateConfig({ cognitionLimit: 8000 });
      const boot = service.onApplicationBootstrap();
      releaseRows([{ provider: 'memory', values: { cognitionLimit: 500 } }]);
      await boot;

      expect(service.getConfig().cognitionLimit).toBe(8000);
    });
  });

  describe('lazy restore', () => {
    it('retries on first use after a failed boot restore', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockRejectedValue(new Error('db down'));

      await service.onApplicationBootstrap();
      // The database comes back, and the throttle window has passed.
      vi.mocked(repository.findAll).mockResolvedValue([
        { provider: 'memory', values: { cognitionLimit: 9000 } },
      ] as never);
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 20_000);

      expect(service.getCognitionLimit()).toBe(5000);
      await flush();

      expect(service.getCognitionLimit()).toBe(9000);
    });

    it('throttles lazy restore attempts within the window', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockRejectedValue(new Error('db down'));

      await service.onApplicationBootstrap();
      const callsAfterBoot = vi.mocked(repository.findAll).mock.calls.length;

      service.getCognitionLimit();
      service.getEpisodeProbeLimit();
      await flush();

      expect(vi.mocked(repository.findAll).mock.calls.length).toBe(
        callsAfterBoot,
      );
    });
  });
});
