<script setup lang="ts">
import { computed } from 'vue';

import ExpandableMessageListBody from '@/components/shared/ui/expandable-message-list/expandable-message-list-body/ExpandableMessageListBody.vue';
import ExpandableMessageList from '@/components/shared/ui/expandable-message-list/ExpandableMessageList.vue';
import { sanitizeHtml } from '@/utils/sanitize-html.helper';

import { extractPromptMessages } from '../../helpers/extract-prompt-messages.helper';
import type { DlqPromptSectionProps } from './DlqPromptSection.types';

const props = defineProps<DlqPromptSectionProps>();

const prompt = computed(() => {
  const payload = props.entry.payload as Record<string, unknown> | null;
  const filters = payload?.filters as Record<string, unknown> | undefined;
  const raw = filters?.prompt;
  if (!raw) return undefined;
  // Plain-language prompts render as one message; arrays and JSON strings
  // normalize into message items via the shared extractor.
  if (typeof raw === 'string' && !raw.startsWith('{') && !raw.startsWith('['))
    return raw;

  const messages = extractPromptMessages(props.entry);
  return messages.length > 0 ? messages : String(raw);
});
</script>

<template>
  <ExpandableMessageList
    :items="prompt"
    :render-html="sanitizeHtml"
    class="dlq-prompt-section"
  >
    <template #heading>
      <h4 class="dlq-prompt-section__heading">{{ $t('common.prompt') }}</h4>
    </template>
    <template #body="{ message }">
      <ExpandableMessageListBody :html="sanitizeHtml(message.content)" />
    </template>
  </ExpandableMessageList>
</template>

<style scoped>
.dlq-prompt-section {
  padding: var(--spacing-2);
  padding-right: var(--spacing-8);
}

.dlq-prompt-section__heading {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-tab-debug);
}
</style>
