<script setup lang="ts">
import ExpandableDivider from './ui/expandable-divider/ExpandableDivider.vue';

withDefaults(
  defineProps<{
    isExpanded: boolean;
    hasItems: boolean;
    /** When false, the collapsible divider row is omitted entirely — used to
     *  hide the conversations divider when the sockets section below is not
     *  shown, so the list no longer implies a divider above an empty area. */
    showDivider?: boolean;
  }>(),
  { showDivider: true },
);

const emit = defineEmits<{
  toggleExpanded: [];
}>();
</script>

<template>
  <div v-if="hasItems" class="expandable-list">
    <div v-if="showDivider" class="expandable-list__divider-row">
      <ExpandableDivider
        :is-expanded="isExpanded"
        @toggle="emit('toggleExpanded')"
      />
    </div>

    <!-- Inline expansion: the content pushes sibling toolbar groups down in
         flow, so the conversations and sockets lists stack without covering
         each other. -->
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
  gap: var(--spacing-0-5);
  flex: 1;
  width: 100%;
  min-width: 0;
  padding-inline: var(--spacing-1);
  overflow-y: auto;
}
</style>
