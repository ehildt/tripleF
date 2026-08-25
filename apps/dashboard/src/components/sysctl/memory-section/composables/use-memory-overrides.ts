import { onMounted, ref } from 'vue';

import {
  fetchMemoryOverrides,
  updateMemoryOverrides,
} from '@/api/memory-overrides.api';

/**
 * The memory system variables (sysctl → system): server-side global settings
 * layered over env defaults (the cognition profile character cap plus the
 * episode-probe recency blend). Reads on mount; a write takes effect on the
 * very next request without a restart. Fetch failures leave the fields empty
 * — SysCtl stays usable when memory is off.
 */
export function useMemoryOverrides() {
  const cognitionLimit = ref<number | undefined>(undefined);
  const episodeRecencyWeight = ref<number | undefined>(undefined);
  const episodeRecencyScaleSeconds = ref<number | undefined>(undefined);
  const episodeRecencyMidpoint = ref<number | undefined>(undefined);
  const episodeProbeLimit = ref<number | undefined>(undefined);
  const episodeScoreThreshold = ref<number | undefined>(undefined);
  const constellationNodeLimit = ref<number | undefined>(undefined);
  const isLoading = ref(false);

  async function loadOverrides() {
    isLoading.value = true;
    try {
      const config = await fetchMemoryOverrides();
      cognitionLimit.value = config.cognitionLimit;
      episodeRecencyWeight.value = config.episodeRecencyWeight;
      episodeRecencyScaleSeconds.value = config.episodeRecencyScaleSeconds;
      episodeRecencyMidpoint.value = config.episodeRecencyMidpoint;
      episodeProbeLimit.value = config.episodeProbeLimit;
      episodeScoreThreshold.value = config.episodeScoreThreshold;
      constellationNodeLimit.value = config.constellationNodeLimit;
    } catch {
      cognitionLimit.value = undefined;
      episodeRecencyWeight.value = undefined;
      episodeRecencyScaleSeconds.value = undefined;
      episodeRecencyMidpoint.value = undefined;
      episodeProbeLimit.value = undefined;
      episodeScoreThreshold.value = undefined;
      constellationNodeLimit.value = undefined;
    } finally {
      isLoading.value = false;
    }
  }

  /** Persist a patch; on failure reload so the UI reflects the true value. */
  async function saveOverride(
    patch: Parameters<typeof updateMemoryOverrides>[0],
  ) {
    try {
      await updateMemoryOverrides(patch);
    } catch {
      await loadOverrides();
    }
  }

  async function saveCognitionLimit(value: number) {
    cognitionLimit.value = value;
    await saveOverride({ cognitionLimit: value });
  }

  async function saveEpisodeRecencyWeight(value: number) {
    episodeRecencyWeight.value = value;
    await saveOverride({ episodeRecencyWeight: value });
  }

  async function saveEpisodeRecencyScaleSeconds(value: number) {
    episodeRecencyScaleSeconds.value = value;
    await saveOverride({ episodeRecencyScaleSeconds: value });
  }

  async function saveEpisodeRecencyMidpoint(value: number) {
    episodeRecencyMidpoint.value = value;
    await saveOverride({ episodeRecencyMidpoint: value });
  }

  async function saveEpisodeProbeLimit(value: number) {
    episodeProbeLimit.value = value;
    await saveOverride({ episodeProbeLimit: value });
  }

  async function saveEpisodeScoreThreshold(value: number) {
    episodeScoreThreshold.value = value;
    await saveOverride({ episodeScoreThreshold: value });
  }

  async function saveConstellationNodeLimit(value: number) {
    constellationNodeLimit.value = value;
    await saveOverride({ constellationNodeLimit: value });
  }

  onMounted(loadOverrides);

  return {
    cognitionLimit,
    episodeRecencyWeight,
    episodeRecencyScaleSeconds,
    episodeRecencyMidpoint,
    episodeProbeLimit,
    episodeScoreThreshold,
    constellationNodeLimit,
    isLoading,
    saveCognitionLimit,
    saveEpisodeRecencyWeight,
    saveEpisodeRecencyScaleSeconds,
    saveEpisodeRecencyMidpoint,
    saveEpisodeProbeLimit,
    saveEpisodeScoreThreshold,
    saveConstellationNodeLimit,
  };
}
