<script setup lang="ts">
import ExpandableDivider from './ui/expandable-divider/ExpandableDivider.vue';

defineProps<{
  isExpanded: boolean;
  hasItems: boolean;
}>();

defineEmits<{
  toggleExpanded: [];
}>();
</script>

<template>
  <div v-if="hasItems" class="expandable-list">
    <div class="expandable-list__divider-row">
      <ExpandableDivider
        :is-expanded="isExpanded"
        @toggle="$emit('toggleExpanded')"
      />
    </div>

    <div v-if="isExpanded" class="expandable-list__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.expandable-list {
  width: 100%;
}

.expandable-list__divider-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
  justify-content: flex-end;
}

.expandable-list__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  flex: 1;
  width: 100%;
  min-width: 0;
  padding-inline: var(--spacing-2);
  overflow-y: auto;
}
</style>
