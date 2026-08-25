<script setup lang="ts">
/**
 * The Memory tab's configuration sub-section: the memory identity keys
 * (partition + cognition space) and the memory system variables (cognition
 * cap + episode-probe recency blend). Moved out of the System tab.
 */
import {
  Brain,
  Clock,
  Filter,
  Fingerprint,
  Gauge,
  Layers,
  Network,
  Scale,
  SlidersHorizontal,
} from '@lucide/vue';
import { storeToRefs } from 'pinia';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import { useAppStore } from '@/stores/app';

import SpaceSelector from '../../system-section/space-selector/SpaceSelector.vue';
import { useMemoryOverrides } from '../composables/use-memory-overrides';

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
  saveCognitionLimit,
  saveEpisodeRecencyWeight,
  saveEpisodeRecencyScaleSeconds,
  saveEpisodeRecencyMidpoint,
  saveEpisodeProbeLimit,
  saveEpisodeScoreThreshold,
  saveConstellationNodeLimit,
} = useMemoryOverrides();
</script>

<template>
  <FieldGrid :items-per-row="2">
    <!-- Memory partition: the user's memory space — overrides the default
         (session id) so memory survives browser-session rotation. -->
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

    <!-- Memory cognition: a SEPARATE key space for the AI's own understanding
         of the user. The picker selects from the history, removes list
         entries (data survives), and creates a new space from a typed name. -->
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

    <!-- Cognition limit: the serialized profile character cap. -->
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

    <!-- Constellation node limit: how many fact dots the diagram loads. -->
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

    <!-- Episode-probe recency blend: system variables shaping the short-term
         conversation-memory ranking (relevance + recency). -->
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
</template>

<style scoped>
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
