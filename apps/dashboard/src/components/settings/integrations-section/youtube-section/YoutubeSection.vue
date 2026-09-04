<script setup lang="ts">
import { Clapperboard, KeyRound } from '@lucide/vue';
import { computed } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import InputText from '@/components/shared/ui/input-text/InputText.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import { i18n } from '@/i18n/i18n';

import { useApiKeyForm } from '../../composables/use-api-key-form';
import type { YouTubeConfig } from '../../settings-config.model';
import ProviderSection from '../shared/ui/provider-section/ProviderSection.vue';

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
      <FieldCard
        :icon="KeyRound"
        :label="$t('common.apiKey')"
        :description="$t('common.youtubeDataApiKey')"
      >
        <template #field>
          <InputText
            v-model="draft"
            variant="borderless"
            name="youtube-api-key"
            autocomplete="off"
            :spellcheck="false"
            @focus="selectAllText"
            @change="submit"
          />
        </template>
      </FieldCard>
    </template>
  </ProviderSection>
</template>
