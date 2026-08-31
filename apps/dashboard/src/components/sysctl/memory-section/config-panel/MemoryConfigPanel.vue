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
  Clock,
  Cpu,
  Database,
  Filter,
  Fingerprint,
  Gauge,
  GitBranch,
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
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import { useMemoryOverrides } from '@/composables/use-memory-overrides';
import { useAppStore } from '@/stores/app';

import SpaceSelector from '../../system-section/space-selector/SpaceSelector.vue';
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
} = useMemoryOverrides();
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
            <input
              v-model="memoryPartition"
              type="text"
              name="memory-partition"
              class="memory-config-panel__input"
              autocomplete="off"
              spellcheck="false"
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
            <input
              :value="consolidateModel ?? ''"
              type="text"
              name="memory-consolidate-model"
              class="memory-config-panel__input"
              autocomplete="off"
              spellcheck="false"
              @change="
                saveConsolidateModel(($event.target as HTMLInputElement).value)
              "
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
            <input
              :value="classifyModel ?? ''"
              type="text"
              name="memory-classify-model"
              class="memory-config-panel__input"
              autocomplete="off"
              spellcheck="false"
              @change="
                saveClassifyModel(($event.target as HTMLInputElement).value)
              "
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
            <input
              :value="reflectModel ?? ''"
              type="text"
              name="memory-reflect-model"
              class="memory-config-panel__input"
              autocomplete="off"
              spellcheck="false"
              @change="
                saveReflectModel(($event.target as HTMLInputElement).value)
              "
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
            <input
              :value="convictionModel ?? ''"
              type="text"
              name="memory-conviction-model"
              class="memory-config-panel__input"
              autocomplete="off"
              spellcheck="false"
              @change="
                saveConvictionModel(($event.target as HTMLInputElement).value)
              "
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
            <input
              :value="clusterModel ?? ''"
              type="text"
              name="memory-cluster-model"
              class="memory-config-panel__input"
              autocomplete="off"
              spellcheck="false"
              @change="
                saveClusterModel(($event.target as HTMLInputElement).value)
              "
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
  gap: var(--spacing-1);
}

.memory-config-panel__input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  text-align: center;
  outline: none;
}
</style>
