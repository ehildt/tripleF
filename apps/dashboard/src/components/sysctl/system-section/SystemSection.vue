<script setup lang="ts">
/**
 * The SysCtl "System" tab: system health tiles on top, then the Ollama
 * connection (host + masked API key, same override contract as the Serper
 * provider). Interface visibility switches live on the separate Interface
 * tab.
 */
import {
  Activity,
  Brain,
  Clock,
  Fingerprint,
  Gauge,
  KeyRound,
  Layers,
  Scale,
  Server,
  SlidersHorizontal,
} from '@lucide/vue';
import { storeToRefs } from 'pinia';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import { useAppStore } from '@/stores/app';

import SectionHeader from '../../shared/ui/section-header/SectionHeader.vue';
import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
import SystemHealthSection from '../system-health-section/SystemHealthSection.vue';
import type { HealthTileViewModel } from '../types/health-tile-view-model.type';
import CognitionPanel from './cognition-panel/CognitionPanel.vue';
import { useMemoryCognition } from './composables/use-memory-cognition';
import { useMemoryOverrides } from './composables/use-memory-overrides';
import { useMemoryPartition } from './composables/use-memory-partition';
import { useOllamaConnection } from './composables/use-ollama-connection';
import PartitionPanel from './partition-panel/PartitionPanel.vue';
import SpaceSelector from './space-selector/SpaceSelector.vue';

defineProps<{
  tiles: HealthTileViewModel[];
}>();

const {
  isLoading,
  hasError,
  resetProvider,
  apiKeyDraft,
  selectApiKeyText,
  submitApiKey,
  hostDraft,
  submitHost,
} = useOllamaConnection();

const {
  warmModelOnSelect,
  memoryPartition,
  memoryCognition,
  memoryCognitionSpaces,
} = storeToRefs(useAppStore());
const {
  toggleWarmModelOnSelect,
  setMemoryCognition,
  removeMemoryCognitionSpace,
} = useAppStore();

const {
  cognitionDisplay,
  isLoading: isCognitionLoading,
  isUnavailable: isCognitionUnavailable,
  wipeArmed,
  hasCognition,
  refreshCognition,
  handleWipeClick,
} = useMemoryCognition();
const {
  cognitionLimit,
  episodeRecencyWeight,
  episodeRecencyScaleSeconds,
  episodeRecencyMidpoint,
  episodeProbeLimit,
  saveCognitionLimit,
  saveEpisodeRecencyWeight,
  saveEpisodeRecencyScaleSeconds,
  saveEpisodeRecencyMidpoint,
  saveEpisodeProbeLimit,
} = useMemoryOverrides();
const {
  factsDisplay,
  isLoading: isFactsLoading,
  isUnavailable: isFactsUnavailable,
  wipeArmed: factsWipeArmed,
  hasFacts,
  refreshFacts,
  handleWipeClick: handleFactsWipeClick,
} = useMemoryPartition();
</script>

<template>
  <SysCtlSection :loading="isLoading" :error="hasError">
    <div class="system-section">
      <SectionHeader :icon="Activity" :title="$t('common.health')" />
      <SystemHealthSection :tiles="tiles" />
    </div>

    <div class="system-section">
      <SectionHeader :icon="Server" :title="$t('common.ollama')" />

      <div class="system-section__actions">
        <ResetButton
          :title="$t('common.resetOllamaToDefaults')"
          @click="resetProvider('ollama')"
        />
      </div>

      <FieldGrid :items-per-row="2">
        <!-- API key field: displays the masked key (****************),
               patches on change. The real key never reaches the client.
               Setting a key also unlocks the Ollama Cloud models. -->
        <FieldCard
          :icon="KeyRound"
          :label="$t('common.apiKey')"
          :description="$t('common.ollamaCloudAccessKey')"
        >
          <template #field>
            <input
              v-model="apiKeyDraft"
              type="text"
              name="ollama-api-key"
              class="system-section__input"
              autocomplete="off"
              spellcheck="false"
              @focus="selectApiKeyText"
              @change="submitApiKey"
            />
          </template>
        </FieldCard>

        <FieldCard
          :icon="Server"
          :label="$t('common.host')"
          description="http://localhost:11434/api or https://ollama.com/api"
        >
          <template #field>
            <input
              v-model="hostDraft"
              type="text"
              name="ollama-host"
              class="system-section__input"
              autocomplete="off"
              spellcheck="false"
              @change="submitHost"
            />
          </template>
        </FieldCard>

        <FieldCard
          :icon="Server"
          :label="$t('common.warmModelOnSelect')"
          :description="$t('common.warmModelOnSelectDesc')"
          :checked="warmModelOnSelect"
          @toggle="toggleWarmModelOnSelect"
        />

        <!-- Memory partition: the user's memory space — overrides the
             default (session id) so memory survives browser-session
             rotation. Empty = session is the partition. -->
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
              class="system-section__input"
              autocomplete="off"
              spellcheck="false"
            />
          </template>
        </FieldCard>
        <!-- Memory cognition: a SEPARATE key space for the AI's own
             understanding of the user (structured profile + probed
             insights). The picker selects from the history, removes list
             entries (data survives), and creates a new space from a typed
             name. Empty = cognition lives in the memory partition. -->
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

        <!-- Cognition limit: the serialized profile character cap — a system
             variable (memory-overrides), env baseline MEMORY_COGNITION_LIMIT,
             effective on the next request. -->
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

        <!-- Episode-probe recency blend: system variables shaping the
             short-term conversation-memory ranking (relevance + recency). -->
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
          :number-min="1"
          :number-max="10"
          :show-checkbox="false"
          @update:number-value="saveEpisodeProbeLimit"
        />
      </FieldGrid>

      <!-- The AI's cognition read-out: structured profile + probed insights
           of the active cognition space; armed two-click wipe. -->
      <CognitionPanel
        :display-text="cognitionDisplay"
        :is-unavailable="isCognitionUnavailable"
        :is-empty="!hasCognition && !isCognitionLoading"
        :wipe-armed="wipeArmed"
        :disabled="isCognitionLoading"
        @refresh="refreshCognition"
        @wipe="handleWipeClick"
      />

      <!-- The user's memory partition read-out: their stored fact records
           for the active partition key; armed two-click prune. -->
      <PartitionPanel
        :display-text="factsDisplay"
        :is-unavailable="isFactsUnavailable"
        :is-empty="!hasFacts && !isFactsLoading"
        :wipe-armed="factsWipeArmed"
        :disabled="isFactsLoading"
        @refresh="refreshFacts"
        @wipe="handleFactsWipeClick"
      />
    </div>
  </SysCtlSection>
</template>

<style scoped>
.system-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.system-section__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-1);
  min-height: calc(2.25rem + 2 * var(--spacing-2));
  padding: 0 var(--spacing-3);
  background:
    radial-gradient(
      ellipse 120% 140% at 12% 50%,
      color-mix(in srgb, var(--color-accent-primary) 18%, transparent) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 120% 140% at 88% 50%,
      color-mix(in srgb, var(--color-accent-secondary) 14%, transparent) 0%,
      transparent 60%
    ),
    var(--color-bg-elevated);
}

.system-section__input {
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
