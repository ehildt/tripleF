<script setup lang="ts">
import { Clapperboard, KeyRound } from '@lucide/vue';
import { computed } from 'vue';

import ProviderSection from '@/components/settings/integrations-section/shared/ui/provider-section/ProviderSection.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import TextFieldCard from '@/components/shared/ui/text-field-card/TextFieldCard.vue';
import { i18n } from '@/i18n/i18n';

import { useApiKeyForm } from '../../composables/use-api-key-form';
import type { YouTubeConfig } from '../../settings-config.model';

const props = defineProps<{
  config: YouTubeConfig;
  updateApiKey: (apiKey: string) => Promise<boolean>;
}>();

const emit = defineEmits<{
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
  reset: [];
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
    </template>

    <template #apiKey>
      <TextFieldCard
        v-model="draft"
        :icon="KeyRound"
        :label="$t('common.apiKey')"
        :description="$t('common.youtubeDataApiKey')"
        name="youtube-api-key"
        :on-commit="submit"
        :on-focus="selectAllText"
      />
    </template>
  </ProviderSection>
</template>
