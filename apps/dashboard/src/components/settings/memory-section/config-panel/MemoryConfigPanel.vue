<script setup lang="ts">
/**
 * The Memory tab's configuration panel: renders one configuration group at a
 * time, selected by the icon submenu in MemorySection. Groups:
 *
 * - Memory spaces: the identity keys your memory lanes are stored under
 *   (partition facts + cognition key space).
 * - Short-term memory probe: the system variables shaping which recent
 *   conversation episodes get injected into each chat turn.
 * - Cognition profile: the character cap of the AI's profile document.
 * - Constellation diagram: how many fact dots the Memory tab canvases draw.
 * - Maintenance models / auto-triggers / sweep limits: the background sweeps.
 */
import {
  Brain,
  BrainCircuit,
  Clock,
  Compass,
  Cpu,
  Database,
  FileDown,
  Filter,
  Fingerprint,
  Gauge,
  GitBranch,
  Globe,
  History,
  Layers,
  ListChecks,
  Network,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Workflow,
  Zap,
} from '@lucide/vue';
import { storeToRefs } from 'pinia';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import InputSelect from '@/components/shared/ui/input-select/InputSelect.vue';
import InputText from '@/components/shared/ui/input-text/InputText.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import { useMemoryOverrides } from '@/composables/use-memory-overrides';
import { useAppStore } from '@/stores/app';
import { useModelsStore } from '@/stores/models';

import SpaceSelector from '../../system-section/space-selector/SpaceSelector.vue';
import ModelSelectField from './model-select-field/ModelSelectField.vue';
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
const { modelNames } = storeToRefs(useModelsStore());

/** The search providers the gap-filling researcher can use. */
const RESEARCH_PROVIDER_OPTIONS = ['serper', 'bright-data'];
</script>

<template>
  <div class="memory-config-panel">
    <!-- Memory spaces: the identity keys your memory lanes are stored under.
         The partition key overrides the default (session id) so memory
         survives browser-session rotation; the cognition key selects a
         SEPARATE space for the AI's own understanding of the user. -->
    <div v-if="activeGroup === 'spaces'" class="memory-config-panel__group">
      <SectionHeader
        :icon="Database"
        :title="$t('common.memorySpacesSection')"
      />
      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="Brain"
          :label="$t('common.memoryPartition')"
          :description="$t('common.memoryPartitionDesc')"
        >
          <template #field>
            <InputText
              v-model="memoryPartition"
              variant="borderless"
              name="memory-partition"
              autocomplete="off"
              :spellcheck="false"
            />
          </template>
        </FieldCard>

        <FieldCard
          :icon="Fingerprint"
          :label="$t('common.memoryCognition')"
          :description="$t('common.memoryCognitionKeyDesc')"
        >
          <template #field>
            <SpaceSelector
              :spaces="memoryCognitionSpaces"
              :active-space="memoryCognition"
              @select="setMemoryCognition"
              @create="setMemoryCognition"
              @remove="removeMemoryCognitionSpace"
            />
          </template>
        </FieldCard>
      </FieldGrid>
    </div>

    <!-- Short-term memory probe: system variables shaping the recent-episode
         records ranked and injected into every chat turn (relevance +
         recency). -->
    <div
      v-if="activeGroup === 'episodeProbe'"
      class="memory-config-panel__group"
    >
      <SectionHeader
        :icon="History"
        :title="$t('common.memoryEpisodeProbeSection')"
      />
      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="Scale"
          :label="$t('common.episodeRecencyWeight')"
          :description="$t('common.episodeRecencyWeightDesc')"
          :number-value="episodeRecencyWeight"
          :number-step="0.05"
          :number-min="0"
          :number-max="1"
          :show-checkbox="false"
          @update:number-value="saveEpisodeRecencyWeight"
        />
        <FieldCard
          :icon="Clock"
          :label="$t('common.episodeRecencyScale')"
          :description="$t('common.episodeRecencyScaleDesc')"
          :number-value="episodeRecencyScaleSeconds"
          :number-step="86400"
          :number-min="60"
          :number-max="31536000"
          :show-checkbox="false"
          @update:number-value="saveEpisodeRecencyScaleSeconds"
        />
        <FieldCard
          :icon="SlidersHorizontal"
          :label="$t('common.episodeRecencyMidpoint')"
          :description="$t('common.episodeRecencyMidpointDesc')"
          :number-value="episodeRecencyMidpoint"
          :number-step="0.01"
          :number-min="0.01"
          :number-max="0.99"
          :show-checkbox="false"
          @update:number-value="saveEpisodeRecencyMidpoint"
        />
        <FieldCard
          :icon="Layers"
          :label="$t('common.episodeProbeLimit')"
          :description="$t('common.episodeProbeLimitDesc')"
          :number-value="episodeProbeLimit"
          :number-step="1"
          :number-min="0"
          :show-checkbox="false"
          @update:number-value="saveEpisodeProbeLimit"
        />
        <FieldCard
          :icon="Filter"
          :label="$t('common.episodeScoreThreshold')"
          :description="$t('common.episodeScoreThresholdDesc')"
          :number-value="episodeScoreThreshold"
          :number-step="0.05"
          :number-min="0"
          :number-max="1"
          :show-checkbox="false"
          @update:number-value="saveEpisodeScoreThreshold"
        />
      </FieldGrid>
    </div>

    <!-- Cognition profile: the serialized profile character cap. -->
    <div
      v-if="activeGroup === 'cognitionProfile'"
      class="memory-config-panel__group"
    >
      <SectionHeader
        :icon="Gauge"
        :title="$t('common.memoryCognitionProfileSection')"
      />
      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="Gauge"
          :label="$t('common.memoryCognitionCap')"
          :description="$t('common.memoryCognitionCapDesc')"
          :number-value="cognitionLimit"
          :number-min="500"
          :number-max="32000"
          :show-checkbox="false"
          @update:number-value="saveCognitionLimit"
        />
      </FieldGrid>
    </div>

    <!-- Constellation diagram: how many fact dots the Memory tab canvases
         draw. -->
    <div
      v-if="activeGroup === 'constellationDiagram'"
      class="memory-config-panel__group"
    >
      <SectionHeader
        :icon="Network"
        :title="$t('common.memoryDiagramSection')"
      />
      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="Network"
          :label="$t('common.memoryConstellationNodeLimit')"
          :description="$t('common.memoryConstellationNodeLimitDesc')"
          :number-value="constellationNodeLimit"
          :number-step="100"
          :number-min="100"
          :number-max="10000"
          :show-checkbox="false"
          @update:number-value="saveConstellationNodeLimit"
        />
      </FieldGrid>
    </div>

    <!-- Maintenance models: every chat model the sweeps use, client-settable
         with the env baseline as fallback. The embedding model is deliberately
         NOT here — it owns the vector space and must never change mid-life. -->
    <div
      v-if="activeGroup === 'maintenanceModels'"
      class="memory-config-panel__group"
    >
      <SectionHeader
        :icon="Cpu"
        :title="$t('common.memoryMaintenanceModels')"
      />
      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="Workflow"
          :label="$t('common.memoryConsolidateModel')"
          :description="$t('common.memoryConsolidateModelDesc')"
          :show-checkbox="false"
        >
          <template #field>
            <ModelSelectField
              :model-value="consolidateModel"
              :options="modelNames"
              @update:model-value="saveConsolidateModel"
            />
          </template>
        </FieldCard>
        <FieldCard
          :icon="Tags"
          :label="$t('common.memoryClassifyModel')"
          :description="$t('common.memoryClassifyModelDesc')"
          :show-checkbox="false"
        >
          <template #field>
            <ModelSelectField
              :model-value="classifyModel"
              :options="modelNames"
              @update:model-value="saveClassifyModel"
            />
          </template>
        </FieldCard>
        <FieldCard
          :icon="Scale"
          :label="$t('common.memoryReflectModel')"
          :description="$t('common.memoryReflectModelDesc')"
          :show-checkbox="false"
        >
          <template #field>
            <ModelSelectField
              :model-value="reflectModel"
              :options="modelNames"
              @update:model-value="saveReflectModel"
            />
          </template>
        </FieldCard>
        <FieldCard
          :icon="Sparkles"
          :label="$t('common.memoryConvictionModel')"
          :description="$t('common.memoryConvictionModelDesc')"
          :show-checkbox="false"
        >
          <template #field>
            <ModelSelectField
              :model-value="convictionModel"
              :options="modelNames"
              @update:model-value="saveConvictionModel"
            />
          </template>
        </FieldCard>
        <FieldCard
          :icon="GitBranch"
          :label="$t('common.memoryClusterModel')"
          :description="$t('common.memoryClusterModelDesc')"
          :show-checkbox="false"
        >
          <template #field>
            <ModelSelectField
              :model-value="clusterModel"
              :options="modelNames"
              @update:model-value="saveClusterModel"
            />
          </template>
        </FieldCard>
      </FieldGrid>
    </div>

    <!-- Auto-triggers: which downstream sweeps fire automatically after an
         upstream job completes. Off by default — manual endpoints remain. -->
    <div
      v-if="activeGroup === 'autoTriggers'"
      class="memory-config-panel__group"
    >
      <SectionHeader :icon="Zap" :title="$t('common.memoryAutoTriggers')" />
      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="Workflow"
          :label="$t('common.memoryPartitionReflectAuto')"
          :description="$t('common.memoryPartitionReflectAutoDesc')"
          :checked="partitionReflectAutoEnabled"
          @toggle="
            savePartitionReflectAutoEnabled(!partitionReflectAutoEnabled)
          "
        />
        <FieldCard
          :icon="Brain"
          :label="$t('common.memoryCognitionReflectAuto')"
          :description="$t('common.memoryCognitionReflectAutoDesc')"
          :checked="cognitionReflectAutoEnabled"
          @toggle="
            saveCognitionReflectAutoEnabled(!cognitionReflectAutoEnabled)
          "
        />
        <FieldCard
          :icon="Tags"
          :label="$t('common.memoryEncyclopediaReflectAuto')"
          :description="$t('common.memoryEncyclopediaReflectAutoDesc')"
          :checked="encyclopediaReflectAutoEnabled"
          @toggle="
            saveEncyclopediaReflectAutoEnabled(!encyclopediaReflectAutoEnabled)
          "
        />
        <FieldCard
          :icon="Sparkles"
          :label="$t('common.memoryConvictionAuto')"
          :description="$t('common.memoryConvictionAutoDesc')"
          :checked="convictionAutoEnabled"
          @toggle="saveConvictionAutoEnabled(!convictionAutoEnabled)"
        />
        <FieldCard
          :icon="GitBranch"
          :label="$t('common.memoryClusterAuto')"
          :description="$t('common.memoryClusterAutoDesc')"
          :checked="clusterAutoEnabled"
          @toggle="saveClusterAutoEnabled(!clusterAutoEnabled)"
        />
      </FieldGrid>
    </div>

    <!-- Sweep limits: batch sizes and caps for the maintenance passes. -->
    <div
      v-if="activeGroup === 'sweepLimits'"
      class="memory-config-panel__group"
    >
      <SectionHeader
        :icon="ListChecks"
        :title="$t('common.memorySweepLimits')"
      />
      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="Scale"
          :label="$t('common.memoryReflectBatchLimit')"
          :description="$t('common.memoryReflectBatchLimitDesc')"
          :number-value="reflectBatchLimit"
          :number-step="1"
          :number-min="1"
          :number-max="500"
          :show-checkbox="false"
          @update:number-value="saveReflectBatchLimit"
        />
        <FieldCard
          :icon="Filter"
          :label="$t('common.memoryReflectMaxCandidates')"
          :description="$t('common.memoryReflectMaxCandidatesDesc')"
          :number-value="reflectMaxCandidates"
          :number-step="1"
          :number-min="1"
          :number-max="100"
          :show-checkbox="false"
          @update:number-value="saveReflectMaxCandidates"
        />
        <FieldCard
          :icon="Sparkles"
          :label="$t('common.memoryConvictionBatchLimit')"
          :description="$t('common.memoryConvictionBatchLimitDesc')"
          :number-value="convictionBatchLimit"
          :number-step="1"
          :number-min="1"
          :number-max="500"
          :show-checkbox="false"
          @update:number-value="saveConvictionBatchLimit"
        />
        <FieldCard
          :icon="Layers"
          :label="$t('common.memoryConvictionMaxPerCluster')"
          :description="$t('common.memoryConvictionMaxPerClusterDesc')"
          :number-value="convictionMaxPerCluster"
          :number-step="1"
          :number-min="1"
          :number-max="1000"
          :show-checkbox="false"
          @update:number-value="saveConvictionMaxPerCluster"
        />
        <FieldCard
          :icon="GitBranch"
          :label="$t('common.memoryClusterMinMembers')"
          :description="$t('common.memoryClusterMinMembersDesc')"
          :number-value="clusterMinMembers"
          :number-step="1"
          :number-min="1"
          :number-max="100"
          :show-checkbox="false"
          @update:number-value="saveClusterMinMembers"
        />
        <FieldCard
          :icon="Workflow"
          :label="$t('common.memoryRaptorEnabled')"
          :description="$t('common.memoryRaptorEnabledDesc')"
          :checked="raptorEnabled"
          @toggle="saveRaptorEnabled(!raptorEnabled)"
        />
        <FieldCard
          :icon="Layers"
          :label="$t('common.memoryRaptorMaxDepth')"
          :description="$t('common.memoryRaptorMaxDepthDesc')"
          :number-value="raptorMaxDepth"
          :number-step="1"
          :number-min="1"
          :number-max="3"
          :show-checkbox="false"
          @update:number-value="saveRaptorMaxDepth"
        />
      </FieldGrid>
    </div>

    <!-- Gap-filling research: the background researcher that closes
         knowledge-base gaps the user's own searches left behind, then
         follows referenced topics one deep-dive per depth. Off by default. -->
    <div v-if="activeGroup === 'research'" class="memory-config-panel__group">
      <SectionHeader
        :icon="BrainCircuit"
        :title="$t('common.memoryResearchSection')"
      />
      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="BrainCircuit"
          :label="$t('common.memoryResearchEnabled')"
          :description="$t('common.memoryResearchEnabledDesc')"
          :checked="researchEnabled"
          @toggle="saveResearchEnabled(!researchEnabled)"
        />
        <FieldCard
          :icon="Globe"
          :label="$t('common.memoryResearchSearchEnabled')"
          :description="$t('common.memoryResearchSearchEnabledDesc')"
          :checked="researchSearchEnabled"
          @toggle="saveResearchSearchEnabled(!researchSearchEnabled)"
        />
        <FieldCard
          :icon="Compass"
          :label="$t('common.memoryResearchProvider')"
          :description="$t('common.memoryResearchProviderDesc')"
          :show-checkbox="false"
        >
          <template #field>
            <InputSelect
              :model-value="researchProvider ?? 'serper'"
              :options="RESEARCH_PROVIDER_OPTIONS"
              @update:model-value="saveResearchProvider"
            />
          </template>
        </FieldCard>
        <FieldCard
          :icon="Cpu"
          :label="$t('common.memoryResearchModel')"
          :description="$t('common.memoryResearchModelDesc')"
          :show-checkbox="false"
        >
          <template #field>
            <ModelSelectField
              :model-value="researchModel"
              :options="modelNames"
              @update:model-value="saveResearchModel"
            />
          </template>
        </FieldCard>
        <FieldCard
          :icon="ListChecks"
          :label="$t('common.memoryResearchGapLimit')"
          :description="$t('common.memoryResearchGapLimitDesc')"
          :number-value="researchGapLimit"
          :number-step="1"
          :number-min="1"
          :number-max="50"
          :show-checkbox="false"
          @update:number-value="saveResearchGapLimit"
        />
        <FieldCard
          :icon="Layers"
          :label="$t('common.memoryResearchMaxDepth')"
          :description="$t('common.memoryResearchMaxDepthDesc')"
          :number-value="researchMaxDepth"
          :number-step="1"
          :number-min="1"
          :number-max="3"
          :show-checkbox="false"
          @update:number-value="saveResearchMaxDepth"
        />
        <FieldCard
          :icon="FileDown"
          :label="$t('common.memoryResearchFetchBudget')"
          :description="$t('common.memoryResearchFetchBudgetDesc')"
          :number-value="researchFetchBudget"
          :number-step="1"
          :number-min="1"
          :number-max="20"
          :show-checkbox="false"
          @update:number-value="saveResearchFetchBudget"
        />
        <FieldCard
          :icon="Scale"
          :label="$t('common.memoryResearchFrictionLimit')"
          :description="$t('common.memoryResearchFrictionLimitDesc')"
          :number-value="researchFrictionLimit"
          :number-step="1"
          :number-min="1"
          :number-max="20"
          :show-checkbox="false"
          @update:number-value="saveResearchFrictionLimit"
        />
      </FieldGrid>
    </div>
  </div>
</template>

<style scoped>
.memory-config-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.memory-config-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
