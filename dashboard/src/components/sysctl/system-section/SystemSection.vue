<script setup lang="ts">
/**
 * The SysCtl "System" tab: system health tiles on top, then the Ollama
 * connection (host + masked API key, same override contract as the Serper
 * provider), then the interface visibility switches.
 */
import { KeyRound, Server } from '@lucide/vue';

import CollapsiblePanel from '@/components/shared/ui/collapsible-panel/CollapsiblePanel.vue';
import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';

import { useSysctlTabVisibility } from '../composables/use-sysctl-tab-visibility';
import SystemHealthSection from '../system-health-section/SystemHealthSection.vue';
import TabVisibilitySection from '../tab-visibility-section/TabVisibilitySection.vue';
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

const { isTabVisible, toggleTab, showCounters, toggleShowCounters } =
  useSysctlTabVisibility();
</script>

<template>
  <div class="system-section">
    <div class="system-section__panel panel-glow">
      <CollapsiblePanel id="health" title="Health">
        <SystemHealthSection :tiles="tiles" />
      </CollapsiblePanel>
    </div>

    <div v-if="isLoading" class="system-section__state">Loading…</div>

    <div
      v-else-if="hasError"
      class="system-section__state system-section__state--error"
    >
      Failed to load config.
    </div>

    <div v-else class="system-section__panel panel-glow">
      <CollapsiblePanel id="ollama" title="Ollama">
        <template #actions>
          <ResetButton
            title="Reset Ollama to defaults"
            @click="resetProvider('ollama')"
          />
        </template>

        <div class="system-section__grid">
          <!-- API key field: displays the masked key (****************),
               patches on change. The real key never reaches the client.
               Setting a key also unlocks the Ollama Cloud models. -->
          <FieldCard
            :icon="KeyRound"
            label="API key"
            description="ollama.com cloud access key"
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
            label="Host"
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
        </div>
      </CollapsiblePanel>
    </div>

    <div class="system-section__panel panel-glow">
      <CollapsiblePanel id="interface" title="Interface">
        <TabVisibilitySection
          :is-sockets-visible="isTabVisible('sockets')"
          :show-counters="showCounters"
          @toggle-sockets="toggleTab('sockets')"
          @toggle-counters="toggleShowCounters"
        />
      </CollapsiblePanel>
    </div>
  </div>
</template>

<style scoped>
.system-section {
  display: flex;
  flex-direction: column;
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

.system-section__panel {
  margin: var(--spacing-4) var(--spacing-4) 0;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.system-section__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-1);
  padding: var(--spacing-1);
}

.system-section__state {
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.system-section__state--error {
  color: var(--color-status-error);
}
</style>
