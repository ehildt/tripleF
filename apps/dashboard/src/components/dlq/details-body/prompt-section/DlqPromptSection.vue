<script setup lang="ts">
import { computed } from 'vue';

import ExpandableMessageListBody from '@/components/shared/ui/expandable-message-list/expandable-message-list-body/ExpandableMessageListBody.vue';
import ExpandableMessageList from '@/components/shared/ui/expandable-message-list/ExpandableMessageList.vue';
import type { DlqEntry } from '@/types/dlq-entry.model';
import { sanitizeHtml } from '@/utils/sanitize-html.helper';

const props = defineProps<{
  entry: DlqEntry;
}>();

const prompt = computed(() => {
  const payload = props.entry.payload as Record<string, unknown> | null;
  const filters = payload?.filters as Record<string, unknown> | undefined;
  const raw = filters?.prompt;
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw as any;
  return raw as string;
});

const renderHtml = (content: string) => sanitizeHtml(content);
</script>

<template>
  <ExpandableMessageList :items="prompt" :render-html="renderHtml">
    <template #heading>
      <h4 class="dlq-prompt-section__heading">{{ $t('common.prompt') }}</h4>
    </template>
    <template #body="{ message }">
      <ExpandableMessageListBody
        :html="renderHtml ? renderHtml(message.content) : message.content"
      />
    </template>
  </ExpandableMessageList>
</template>

<style scoped>
.dlq-prompt-section__heading {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-tab-debug);
}
</style>
