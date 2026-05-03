<script setup lang="ts">
import { computed } from 'vue';

import { getDetailFieldColors } from '@/utils/colors/detail-field/get-detail-field-colors.helper';
import { getValueTypeColor } from '@/utils/colors/detail-field/get-value-type-color.helper';
import { getValueTypeGradient } from '@/utils/colors/detail-field/get-value-type-gradient.helper';

function formatLabel(field: string): string {
  switch (field) {
    case 'requestId':
      return 'Request ID';
    case 'roomId':
      return 'Room ID';
    case 'numCtx':
      return 'Num Ctx';
    case 'conversationId':
      return 'Conversation';
    case 'preprocessing':
      return 'Preprocessing';
    case 'statusCode':
      return 'Status';
    case 'responseTime':
      return 'Response Time';
    case 'promptEvalCount':
      return 'Prompt Tokens';
    case 'evalCount':
      return 'Output Tokens';
    case 'totalDuration':
      return 'Total Time';
    case 'errorMessage':
      return 'Error Message';
    case 'tokenPercent':
      return 'Used';
    case 'summarySize':
      return 'Entry Size';
    default:
      return field.charAt(0).toUpperCase() + field.slice(1);
  }
}

const props = defineProps<{
  field: string;
  value: unknown;
}>();

const displayValue = computed(() => {
  const str = String(props.value);
  if (str.length > 80) return str.slice(0, 80) + '...';
  return str;
});

const needsTitle = computed(() => String(props.value).length > 80);
</script>

<template>
  <div
    v-if="value !== undefined && value !== null && value !== ''"
    class="flex items-center flex-1 min-w-0 bg-secondary rounded-none overflow-hidden relative border"
    :class="getDetailFieldColors().border"
  >
    <div
      class="absolute inset-0 bg-gradient-to-r"
      :class="getValueTypeGradient(value) ?? getDetailFieldColors().gradient"
    />
    <span
      class="text-[10px] font-mono font-bold uppercase px-2 py-1 relative z-10 shrink-0"
      :class="getDetailFieldColors().text"
    >
      {{ formatLabel(field) }}
    </span>
    <span
      class="text-[10px] font-mono px-2 py-1 relative z-10 max-w-[300px] truncate"
      :class="getValueTypeColor(value) ?? 'text-fg-primary'"
      :title="needsTitle ? String(value) : undefined"
    >
      {{ displayValue }}
    </span>
  </div>
</template>
