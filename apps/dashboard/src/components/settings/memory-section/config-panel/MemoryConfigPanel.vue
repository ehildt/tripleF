<script setup lang="ts">
/**
 * The Memory tab's configuration panel: owns the shared settings state and
 * renders one context-specific configuration component at a time, selected by
 * the icon submenu in MemorySection.
 */
import { storeToRefs } from 'pinia';

import { useMemoryOverrides } from '@/composables/use-memory-overrides/use-memory-overrides';
import { useAppStore } from '@/stores/app/app.store';
import { useModelsStore } from '@/stores/models/models.store';

import MemoryAutoTriggersConfig from './memory-auto-triggers-config/MemoryAutoTriggersConfig.vue';
import MemoryCognitionProfileConfig from './memory-cognition-profile-config/MemoryCognitionProfileConfig.vue';
import MemoryConstellationDiagramConfig from './memory-constellation-diagram-config/MemoryConstellationDiagramConfig.vue';
import MemoryEpisodeProbeConfig from './memory-episode-probe-config/MemoryEpisodeProbeConfig.vue';
import MemoryMaintenanceModelsConfig from './memory-maintenance-models-config/MemoryMaintenanceModelsConfig.vue';
import MemoryResearchConfig from './memory-research-config/MemoryResearchConfig.vue';
import MemorySpacesConfig from './memory-spaces-config/MemorySpacesConfig.vue';
import MemorySweepLimitsConfig from './memory-sweep-limits-config/MemorySweepLimitsConfig.vue';
import type { MemoryConfigPanelProps } from './MemoryConfigPanel.types';

defineProps<MemoryConfigPanelProps>();

const { memoryPartition, memoryCognition, memoryCognitionSpaces } =
  storeToRefs(useAppStore());
const { setMemoryCognition, removeMemoryCognitionSpace } = useAppStore();

const {
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
  raptorEnabled,
  heatTrackingEnabled,
  raptorMaxDepth,
  researchEnabled,
  researchSearchEnabled,
  researchProvider,
  researchModel,
  researchGapLimit,
  researchMaxDepth,
  researchFetchBudget,
  researchFrictionLimit,
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
  saveRaptorEnabled,
  saveHeatTrackingEnabled,
  saveRaptorMaxDepth,
  saveResearchEnabled,
  saveResearchSearchEnabled,
  saveResearchProvider,
  saveResearchModel,
  saveResearchGapLimit,
  saveResearchMaxDepth,
  saveResearchFetchBudget,
  saveResearchFrictionLimit,
} = useMemoryOverrides();

/** Catalog models offered by the model-override pickers. */
const { localModels, cloudModels, modelsLoading } =
  storeToRefs(useModelsStore());
</script>

<template>
  <MemorySpacesConfig
    v-if="activeGroup === 'spaces'"
    v-model:memory-partition="memoryPartition"
    :memory-cognition="memoryCognition"
    :memory-cognition-spaces="memoryCognitionSpaces"
    :on-select-memory-cognition="setMemoryCognition"
    :on-create-memory-cognition="setMemoryCognition"
    :on-remove-memory-cognition-space="removeMemoryCognitionSpace"
  />

  <MemoryEpisodeProbeConfig
    v-if="activeGroup === 'episodeProbe'"
    :episode-recency-weight="episodeRecencyWeight"
    :episode-recency-scale-seconds="episodeRecencyScaleSeconds"
    :episode-recency-midpoint="episodeRecencyMidpoint"
    :episode-probe-limit="episodeProbeLimit"
    :episode-score-threshold="episodeScoreThreshold"
    :on-save-episode-recency-weight="saveEpisodeRecencyWeight"
    :on-save-episode-recency-scale-seconds="saveEpisodeRecencyScaleSeconds"
    :on-save-episode-recency-midpoint="saveEpisodeRecencyMidpoint"
    :on-save-episode-probe-limit="saveEpisodeProbeLimit"
    :on-save-episode-score-threshold="saveEpisodeScoreThreshold"
  />

  <MemoryCognitionProfileConfig
    v-if="activeGroup === 'cognitionProfile'"
    :cognition-limit="cognitionLimit"
    :on-save-cognition-limit="saveCognitionLimit"
  />

  <MemoryConstellationDiagramConfig
    v-if="activeGroup === 'constellationDiagram'"
    :constellation-node-limit="constellationNodeLimit"
    :on-save-constellation-node-limit="saveConstellationNodeLimit"
  />

  <MemoryMaintenanceModelsConfig
    v-if="activeGroup === 'maintenanceModels'"
    :consolidate-model="consolidateModel"
    :classify-model="classifyModel"
    :reflect-model="reflectModel"
    :conviction-model="convictionModel"
    :cluster-model="clusterModel"
    :local-models="localModels"
    :cloud-models="cloudModels"
    :models-loading="modelsLoading"
    :on-save-consolidate-model="saveConsolidateModel"
    :on-save-classify-model="saveClassifyModel"
    :on-save-reflect-model="saveReflectModel"
    :on-save-conviction-model="saveConvictionModel"
    :on-save-cluster-model="saveClusterModel"
  />

  <MemoryAutoTriggersConfig
    v-if="activeGroup === 'autoTriggers'"
    :partition-reflect-auto-enabled="partitionReflectAutoEnabled"
    :cognition-reflect-auto-enabled="cognitionReflectAutoEnabled"
    :encyclopedia-reflect-auto-enabled="encyclopediaReflectAutoEnabled"
    :conviction-auto-enabled="convictionAutoEnabled"
    :cluster-auto-enabled="clusterAutoEnabled"
    :on-save-partition-reflect-auto-enabled="savePartitionReflectAutoEnabled"
    :on-save-cognition-reflect-auto-enabled="saveCognitionReflectAutoEnabled"
    :on-save-encyclopedia-reflect-auto-enabled="
      saveEncyclopediaReflectAutoEnabled
    "
    :on-save-conviction-auto-enabled="saveConvictionAutoEnabled"
    :on-save-cluster-auto-enabled="saveClusterAutoEnabled"
  />

  <MemorySweepLimitsConfig
    v-if="activeGroup === 'sweepLimits'"
    :reflect-batch-limit="reflectBatchLimit"
    :reflect-max-candidates="reflectMaxCandidates"
    :conviction-batch-limit="convictionBatchLimit"
    :conviction-max-per-cluster="convictionMaxPerCluster"
    :cluster-min-members="clusterMinMembers"
    :raptor-enabled="raptorEnabled"
    :heat-tracking-enabled="heatTrackingEnabled"
    :raptor-max-depth="raptorMaxDepth"
    :on-save-reflect-batch-limit="saveReflectBatchLimit"
    :on-save-reflect-max-candidates="saveReflectMaxCandidates"
    :on-save-conviction-batch-limit="saveConvictionBatchLimit"
    :on-save-conviction-max-per-cluster="saveConvictionMaxPerCluster"
    :on-save-cluster-min-members="saveClusterMinMembers"
    :on-save-raptor-enabled="saveRaptorEnabled"
    :on-save-heat-tracking-enabled="saveHeatTrackingEnabled"
    :on-save-raptor-max-depth="saveRaptorMaxDepth"
  />

  <MemoryResearchConfig
    v-if="activeGroup === 'research'"
    :research-enabled="researchEnabled"
    :research-search-enabled="researchSearchEnabled"
    :research-provider="researchProvider"
    :research-model="researchModel"
    :research-gap-limit="researchGapLimit"
    :research-max-depth="researchMaxDepth"
    :research-fetch-budget="researchFetchBudget"
    :research-friction-limit="researchFrictionLimit"
    :local-models="localModels"
    :cloud-models="cloudModels"
    :models-loading="modelsLoading"
    :on-save-research-enabled="saveResearchEnabled"
    :on-save-research-search-enabled="saveResearchSearchEnabled"
    :on-save-research-provider="saveResearchProvider"
    :on-save-research-model="saveResearchModel"
    :on-save-research-gap-limit="saveResearchGapLimit"
    :on-save-research-max-depth="saveResearchMaxDepth"
    :on-save-research-fetch-budget="saveResearchFetchBudget"
    :on-save-research-friction-limit="saveResearchFrictionLimit"
  />
</template>
