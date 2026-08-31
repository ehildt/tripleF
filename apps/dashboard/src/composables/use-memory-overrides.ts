import { onMounted, ref } from 'vue';

import {
  fetchMemoryOverrides,
  updateMemoryOverrides,
} from '@/api/memory-overrides.api';

/**
 * The memory system variables (sysctl → system): server-side global settings
 * layered over env defaults. Reads on mount; a write takes effect on the
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
  const consolidateModel = ref<string | undefined>(undefined);
  const classifyModel = ref<string | undefined>(undefined);
  const reflectModel = ref<string | undefined>(undefined);
  const convictionModel = ref<string | undefined>(undefined);
  const clusterModel = ref<string | undefined>(undefined);
  const partitionReflectAutoEnabled = ref<boolean | undefined>(undefined);
  const cognitionReflectAutoEnabled = ref<boolean | undefined>(undefined);
  const encyclopediaReflectAutoEnabled = ref<boolean | undefined>(undefined);
  const convictionAutoEnabled = ref<boolean | undefined>(undefined);
  const clusterAutoEnabled = ref<boolean | undefined>(undefined);
  const reflectBatchLimit = ref<number | undefined>(undefined);
  const reflectMaxCandidates = ref<number | undefined>(undefined);
  const convictionBatchLimit = ref<number | undefined>(undefined);
  const convictionMaxPerCluster = ref<number | undefined>(undefined);
  const clusterMinMembers = ref<number | undefined>(undefined);
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
      consolidateModel.value = config.consolidateModel;
      classifyModel.value = config.classifyModel;
      reflectModel.value = config.reflectModel;
      convictionModel.value = config.convictionModel;
      clusterModel.value = config.clusterModel;
      partitionReflectAutoEnabled.value = config.partitionReflectAutoEnabled;
      cognitionReflectAutoEnabled.value = config.cognitionReflectAutoEnabled;
      encyclopediaReflectAutoEnabled.value =
        config.encyclopediaReflectAutoEnabled;
      convictionAutoEnabled.value = config.convictionAutoEnabled;
      clusterAutoEnabled.value = config.clusterAutoEnabled;
      reflectBatchLimit.value = config.reflectBatchLimit;
      reflectMaxCandidates.value = config.reflectMaxCandidates;
      convictionBatchLimit.value = config.convictionBatchLimit;
      convictionMaxPerCluster.value = config.convictionMaxPerCluster;
      clusterMinMembers.value = config.clusterMinMembers;
    } catch {
      cognitionLimit.value = undefined;
      episodeRecencyWeight.value = undefined;
      episodeRecencyScaleSeconds.value = undefined;
      episodeRecencyMidpoint.value = undefined;
      episodeProbeLimit.value = undefined;
      episodeScoreThreshold.value = undefined;
      constellationNodeLimit.value = undefined;
      consolidateModel.value = undefined;
      classifyModel.value = undefined;
      reflectModel.value = undefined;
      convictionModel.value = undefined;
      clusterModel.value = undefined;
      partitionReflectAutoEnabled.value = undefined;
      cognitionReflectAutoEnabled.value = undefined;
      encyclopediaReflectAutoEnabled.value = undefined;
      convictionAutoEnabled.value = undefined;
      clusterAutoEnabled.value = undefined;
      reflectBatchLimit.value = undefined;
      reflectMaxCandidates.value = undefined;
      convictionBatchLimit.value = undefined;
      convictionMaxPerCluster.value = undefined;
      clusterMinMembers.value = undefined;
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

  /** Model fields: empty string clears the override (back to env baseline). */
  async function saveConsolidateModel(value: string) {
    consolidateModel.value = value;
    await saveOverride({ consolidateModel: value.trim() || null });
  }

  async function saveClassifyModel(value: string) {
    classifyModel.value = value;
    await saveOverride({ classifyModel: value.trim() || null });
  }

  async function saveReflectModel(value: string) {
    reflectModel.value = value;
    await saveOverride({ reflectModel: value.trim() || null });
  }

  async function saveConvictionModel(value: string) {
    convictionModel.value = value;
    await saveOverride({ convictionModel: value.trim() || null });
  }

  async function saveClusterModel(value: string) {
    clusterModel.value = value;
    await saveOverride({ clusterModel: value.trim() || null });
  }

  async function savePartitionReflectAutoEnabled(value: boolean) {
    partitionReflectAutoEnabled.value = value;
    await saveOverride({ partitionReflectAutoEnabled: value });
  }

  async function saveCognitionReflectAutoEnabled(value: boolean) {
    cognitionReflectAutoEnabled.value = value;
    await saveOverride({ cognitionReflectAutoEnabled: value });
  }

  async function saveEncyclopediaReflectAutoEnabled(value: boolean) {
    encyclopediaReflectAutoEnabled.value = value;
    await saveOverride({ encyclopediaReflectAutoEnabled: value });
  }

  async function saveConvictionAutoEnabled(value: boolean) {
    convictionAutoEnabled.value = value;
    await saveOverride({ convictionAutoEnabled: value });
  }

  async function saveClusterAutoEnabled(value: boolean) {
    clusterAutoEnabled.value = value;
    await saveOverride({ clusterAutoEnabled: value });
  }

  async function saveReflectBatchLimit(value: number) {
    reflectBatchLimit.value = value;
    await saveOverride({ reflectBatchLimit: value });
  }

  async function saveReflectMaxCandidates(value: number) {
    reflectMaxCandidates.value = value;
    await saveOverride({ reflectMaxCandidates: value });
  }

  async function saveConvictionBatchLimit(value: number) {
    convictionBatchLimit.value = value;
    await saveOverride({ convictionBatchLimit: value });
  }

  async function saveConvictionMaxPerCluster(value: number) {
    convictionMaxPerCluster.value = value;
    await saveOverride({ convictionMaxPerCluster: value });
  }

  async function saveClusterMinMembers(value: number) {
    clusterMinMembers.value = value;
    await saveOverride({ clusterMinMembers: value });
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
    consolidateModel,
    classifyModel,
    reflectModel,
    convictionModel,
    clusterModel,
    partitionReflectAutoEnabled,
    cognitionReflectAutoEnabled,
    encyclopediaReflectAutoEnabled,
    convictionAutoEnabled,
    clusterAutoEnabled,
    reflectBatchLimit,
    reflectMaxCandidates,
    convictionBatchLimit,
    convictionMaxPerCluster,
    clusterMinMembers,
    isLoading,
    saveCognitionLimit,
    saveEpisodeRecencyWeight,
    saveEpisodeRecencyScaleSeconds,
    saveEpisodeRecencyMidpoint,
    saveEpisodeProbeLimit,
    saveEpisodeScoreThreshold,
    saveConstellationNodeLimit,
    saveConsolidateModel,
    saveClassifyModel,
    saveReflectModel,
    saveConvictionModel,
    saveClusterModel,
    savePartitionReflectAutoEnabled,
    saveCognitionReflectAutoEnabled,
    saveEncyclopediaReflectAutoEnabled,
    saveConvictionAutoEnabled,
    saveClusterAutoEnabled,
    saveReflectBatchLimit,
    saveReflectMaxCandidates,
    saveConvictionBatchLimit,
    saveConvictionMaxPerCluster,
    saveClusterMinMembers,
  };
}
