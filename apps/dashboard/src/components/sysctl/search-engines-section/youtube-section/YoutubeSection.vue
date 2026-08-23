<script setup lang="ts">
import { Clapperboard, KeyRound } from '@lucide/vue';
import { computed } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import { i18n } from '@/i18n/i18n';

import { useApiKeyForm } from '../../composables/use-api-key-form';
import ProviderSection from '../../provider-section/ProviderSection.vue';
import type { YouTubeConfig } from '../../sysctl-config.model';

const props = defineProps<{
  config: YouTubeConfig;
  updateApiKey: (apiKey: string) => Promise<boolean>;
}>();

const emit = defineEmits<{
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
  reset: [];
  toggleEnabled: [];
}>();

const configured = computed(() => !!props.config.apiKey);
const maskedApiKey = computed(() => props.config.apiKey ?? '');
const { draft, selectAllText, submit } = useApiKeyForm(
  props.updateApiKey,
  maskedApiKey,
);

const descriptions = computed<Record<string, string>>(() => ({
  videos: i18n.global.t('common.youtubeVideosWithViews'),
}));

const icons = {
  videos: Clapperboard,
};
</script>

<template>
  <ProviderSection
    :config="config"
    :descriptions="descriptions"
    :icons="icons"
    :configured="configured"
    @toggle-endpoint="emit('toggleEndpoint', $event)"
    @update-results="emit('updateResults', $event)"
  >
    <template #actions>
      <ResetButton
        :title="$t('common.resetYouTubeToDefaults')"
        @click="emit('reset')"
      />
      <PowerToggle
        :enabled="config.enabled"
        :title="$t('common.enableYouTube')"
        @toggle="emit('toggleEnabled')"
      />
    </template>

    <template #apiKey>
      <FieldCard
        :icon="KeyRound"
        :label="$t('common.apiKey')"
        :description="$t('common.youtubeDataApiKey')"
      >
        <template #field>
          <input
            v-model="draft"
            type="text"
            name="youtube-api-key"
            class="youtube-section__api-key-input"
            autocomplete="off"
            spellcheck="false"
            @focus="selectAllText"
            @change="submit"
          />
        </template>
      </FieldCard>
    </template>
  </ProviderSection>
</template>

<style scoped>
.youtube-section__api-key-input {
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
