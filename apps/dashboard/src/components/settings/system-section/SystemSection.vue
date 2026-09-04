<script setup lang="ts">
/**
 * The Settings "System" tab: system health tiles on top, then the Ollama
 * connection (host + masked API key, same override contract as the Serper
 * provider). Memory configuration and the memory-layer constellations live
 * on the separate Memory tab.
 */
import { Activity, KeyRound, Server } from '@lucide/vue';
import { storeToRefs } from 'pinia';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import InputText from '@/components/shared/ui/input-text/InputText.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import { useAppStore } from '@/stores/app';

import SectionHeader from '../../shared/ui/section-header/SectionHeader.vue';
import SettingsSection from '../shared/ui/settings-section/SettingsSection.vue';
import SystemHealthSection from '../system-health-section/SystemHealthSection.vue';
import type { HealthTileViewModel } from '../types/health-tile-view-model.type';
import { useOllamaConnection } from './composables/use-ollama-connection';

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

const { warmModelOnSelect } = storeToRefs(useAppStore());
const { toggleWarmModelOnSelect } = useAppStore();
</script>

<template>
  <SettingsSection :loading="isLoading" :error="hasError">
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
            <InputText
              v-model="apiKeyDraft"
              variant="borderless"
              name="ollama-api-key"
              autocomplete="off"
              :spellcheck="false"
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
            <InputText
              v-model="hostDraft"
              variant="borderless"
              name="ollama-host"
              autocomplete="off"
              :spellcheck="false"
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
      </FieldGrid>
    </div>
  </SettingsSection>
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
</style>
