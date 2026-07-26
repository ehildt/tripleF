<script setup lang="ts">
import { computed } from 'vue';

const FIELD_LABELS: Record<string, string> = {
  requestId: 'Request ID',
  roomId: 'Room ID',
  numCtx: 'Num Ctx',
  conversationId: 'Conversation',
  preprocessing: 'Preprocessing',
  statusCode: 'Status',
  responseTime: 'Response Time',
  promptEvalCount: 'Prompt Tokens',
  evalCount: 'Output Tokens',
  totalDuration: 'Total Time',
  errorMessage: 'Error Message',
  tokenPercent: 'Used',
  summarySize: 'Entry Size',
};

const props = defineProps<{
  field: string;
  value: unknown;
}>();

const label = computed(
  () =>
    FIELD_LABELS[props.field] ??
    props.field.charAt(0).toUpperCase() + props.field.slice(1),
);

/** Value-type tint: booleans harmony-1, numbers harmony-2, strings default. */
const valueTypeClass = computed(() => {
  const v = props.value;
  if (
    typeof v === 'boolean' ||
    (typeof v === 'string' && (v === 'true' || v === 'false'))
  ) {
    return 'detail-tag__value--boolean';
  }
  if (
    typeof v === 'number' ||
    (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v))
  ) {
    return 'detail-tag__value--number';
  }
  return null;
});
</script>

<template>
  <div
    v-if="value !== undefined && value !== null && value !== ''"
    class="detail-tag"
  >
    <span class="detail-tag__label">{{ label }}</span>
    <span class="detail-tag__value" :class="valueTypeClass">{{ value }}</span>
  </div>
</template>

<style scoped>
.detail-tag {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  border: 1px solid
    color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-accent-primary) 20%, transparent),
    color-mix(in srgb, var(--color-accent-primary) 5%, transparent),
    transparent
  );
  background-color: var(--color-bg-secondary);
}

.detail-tag__label {
  position: relative;
  flex-shrink: 0;
  padding: var(--spacing-1) var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-accent-primary);
}

.detail-tag__value {
  position: relative;
  padding: var(--spacing-1) var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

.detail-tag__value--boolean {
  color: var(--color-harmony-1);
}

/* harmony-2 is too dark for text on our dark surfaces — the mint tab-debug
   tone keeps numbers legible while still tinting them. */
.detail-tag__value--number {
  color: var(--color-tab-debug);
}
</style>
