import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import type { MemoryOverridesConfig } from '@/api/memory-overrides.api';
import {
  fetchMemoryOverrides,
  updateMemoryOverrides,
} from '@/api/memory-overrides.api';

vi.mock('@/api/memory-overrides.api', () => ({
  fetchMemoryOverrides: vi.fn(),
  updateMemoryOverrides: vi.fn(),
}));

import { useMemoryOverrides } from './use-memory-overrides';

function config(
  partial: Partial<MemoryOverridesConfig> = {},
): MemoryOverridesConfig {
  return {
    cognitionLimit: 5000,
    baseline: 5000,
    overridden: false,
    episodeRecencyWeight: 0.3,
    episodeRecencyScaleSeconds: 604800,
    episodeRecencyMidpoint: 0.5,
    episodeProbeLimit: 3,
    episodeScoreThreshold: 0.1,
    constellationNodeLimit: 5000,
    partitionReflectAutoEnabled: true,
    cognitionReflectAutoEnabled: false,
    encyclopediaReflectAutoEnabled: true,
    convictionAutoEnabled: false,
    clusterAutoEnabled: true,
    reflectBatchLimit: 200,
    reflectMaxCandidates: 10,
    convictionBatchLimit: 100,
    convictionMaxPerCluster: 20,
    clusterMinMembers: 3,
    raptorEnabled: true,
    heatTrackingEnabled: false,
    raptorMaxDepth: 2,
    researchEnabled: false,
    researchSearchEnabled: false,
    researchProvider: 'serper',
    researchGapLimit: 10,
    researchMaxDepth: 2,
    researchFetchBudget: 5,
    researchFrictionLimit: 10,
    ...partial,
  };
}

/** Mount a host so onMounted runs; return the composable's public surface. */
function mountOverrides() {
  let overrides!: ReturnType<typeof useMemoryOverrides>;
  mount(
    defineComponent({
      setup() {
        overrides = useMemoryOverrides();
        return () => h('div');
      },
    }),
  );
  return overrides;
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('useMemoryOverrides', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMemoryOverrides).mockResolvedValue(config());
    vi.mocked(updateMemoryOverrides).mockResolvedValue(config());
  });

  it('loads the server config on mount', async () => {
    const overrides = mountOverrides();
    await flush();
    expect(fetchMemoryOverrides).toHaveBeenCalledOnce();
    expect(overrides.cognitionLimit.value).toBe(5000);
    expect(overrides.episodeProbeLimit.value).toBe(3);
    expect(overrides.researchProvider.value).toBe('serper');
    expect(overrides.isLoading.value).toBe(false);
  });

  it('leaves fields empty when the fetch fails — settings stay usable', async () => {
    vi.mocked(fetchMemoryOverrides).mockRejectedValueOnce(new Error('off'));
    const overrides = mountOverrides();
    await flush();
    expect(overrides.cognitionLimit.value).toBeUndefined();
    expect(overrides.raptorEnabled.value).toBeUndefined();
    expect(overrides.isLoading.value).toBe(false);
  });

  it('writes an optimistic override and persists its patch', async () => {
    const overrides = mountOverrides();
    await flush();
    await overrides.saveEpisodeScoreThreshold(0.4);
    expect(overrides.episodeScoreThreshold.value).toBeCloseTo(0.4);
    expect(updateMemoryOverrides).toHaveBeenCalledWith({
      episodeScoreThreshold: 0.4,
    });
  });

  it('clears a model override back to the env baseline on empty input', async () => {
    const overrides = mountOverrides();
    await flush();
    await overrides.saveReflectModel('   ');
    expect(updateMemoryOverrides).toHaveBeenCalledWith({ reflectModel: null });
  });

  it('saves a boolean override as-is', async () => {
    const overrides = mountOverrides();
    await flush();
    await overrides.saveHeatTrackingEnabled(true);
    expect(updateMemoryOverrides).toHaveBeenCalledWith({
      heatTrackingEnabled: true,
    });
  });

  it('reloads from the server when a save fails, restoring the true value', async () => {
    const overrides = mountOverrides();
    await flush();
    vi.mocked(updateMemoryOverrides).mockRejectedValueOnce(new Error('boom'));
    await overrides.saveEpisodeProbeLimit(9);
    expect(updateMemoryOverrides).toHaveBeenCalledWith({
      episodeProbeLimit: 9,
    });
    // Failure path re-fetched, restoring server truth over the optimistic value.
    expect(fetchMemoryOverrides).toHaveBeenCalledTimes(2);
    expect(overrides.episodeProbeLimit.value).toBe(3);
  });
});
