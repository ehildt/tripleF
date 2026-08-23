<script lang="ts" setup>
import { PartyPopper } from '@lucide/vue';
import type { Component } from 'vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  // eslint-disable-next-line vue/require-default-prop -- fallback is resolved reactively below so it tracks locale changes
  defineProps<{ message?: string; submessage?: string; icon?: Component }>(),
  {},
);

const { t } = useI18n();

const icon = computed(() => props.icon ?? PartyPopper);
const message = computed(() => props.message ?? t('common.noRequestsYet'));
const submessage = computed(
  () => props.submessage ?? t('common.sendRequestToSeeResults'),
);
</script>

<template>
  <div class="panel-empty-state">
    <div class="panel-empty-state__icon-wrapper">
      <component :is="icon" class="panel-empty-state__icon" />
    </div>
    <p v-if="message" class="panel-empty-state__message">
      {{ message }}
    </p>
    <p v-if="submessage" class="panel-empty-state__submessage">
      {{ submessage }}
    </p>
  </div>
</template>

<style scoped>
.panel-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem var(--spacing-4);
}

.panel-empty-state__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background-color: var(--color-bg-tertiary);
  margin-bottom: var(--spacing-3);
}

.panel-empty-state__icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-fg-muted);
}

.panel-empty-state__message {
  font-size: 0.875rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  margin: 0;
}

.panel-empty-state__submessage {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 70%, transparent);
  margin: var(--spacing-1) 0 0;
}
</style>
