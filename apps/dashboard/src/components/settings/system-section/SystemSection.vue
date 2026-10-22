<script setup lang="ts">
/**
 * The Settings "System" tab: system health tiles on top, then the Ollama
 * connection (host + masked API key, same override contract as the Serper
 * provider). Memory configuration and the memory-layer constellations live
 * on the separate Memory tab.
 */
import { Activity, KeyRound, RotateCcw, Server } from '@lucide/vue';
import { storeToRefs } from 'pinia';

import SettingsSection from '@/components/settings/shared/ui/settings-section/SettingsSection.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import MenuButton from '@/components/shared/ui/menu-button/MenuButton.vue';
import MenuRow from '@/components/shared/ui/menu-row/MenuRow.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import TextFieldCard from '@/components/shared/ui/text-field-card/TextFieldCard.vue';
import { useAppStore } from '@/stores/app/app.store';

import SystemHealthSection from '../system-health-section/SystemHealthSection.vue';
import { useOllamaConnection } from './composables/use-ollama-connection';
import type { SystemSectionProps } from './SystemSection.types';

defineProps<SystemSectionProps>();

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

      <MenuRow variant="panel" role="toolbar">
        <MenuButton
          :icon="RotateCcw"
          :label="$t('common.resetOllamaToDefaults')"
          @click="resetProvider('ollama')"
        />
      </MenuRow>

      <FieldGrid :items-per-row="2">
        <!-- API key field: displays the masked key (****************),
               patches on change. The real key never reaches the client.
               Setting a key also unlocks the Ollama Cloud models. -->
        <TextFieldCard
          v-model="apiKeyDraft"
          :icon="KeyRound"
          :label="$t('common.apiKey')"
          :description="$t('common.ollamaCloudAccessKey')"
          name="ollama-api-key"
          :on-commit="submitApiKey"
          :on-focus="selectApiKeyText"
        />

        <TextFieldCard
          v-model="hostDraft"
          :icon="Server"
          :label="$t('common.host')"
          description="http://localhost:11434/api or https://ollama.com/api"
          name="ollama-host"
          :on-commit="submitHost"
        />

        <NumberFieldCard
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

/* The first block opens the tab: no sub tab menu here, so the larger
   below-chrome air that usually sits under a menu line goes above it. */
.system-section:first-child {
  padding-top: var(--spacing-3);
}
</style>
