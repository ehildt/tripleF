<script setup lang="ts">
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    value: string;
    active?: boolean;
    /** When true, `value` is treated as a `common.*` i18n key and translated. */
    translate?: boolean;
  }>(),
  {
    active: false,
    translate: false,
  },
);

const { t } = useI18n();
</script>

<template>
  <span class="toolbar-label" :class="{ 'toolbar-label--active': active }">{{
    translate ? t(`common.${value}`) : value
  }}</span>
</template>

<style scoped>
.toolbar-label {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  color: var(--color-fg-secondary);
}

.toolbar-label--active {
  color: var(--color-accent-primary);
}
</style>
