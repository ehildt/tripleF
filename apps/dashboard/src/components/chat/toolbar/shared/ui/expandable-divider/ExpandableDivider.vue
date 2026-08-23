<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue';

defineProps<{
  isExpanded: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <div class="expandable-divider" @click="$emit('toggle')">
    <div class="expandable-divider__line-wrapper">
      <div class="expandable-divider__line"></div>
      <div>
        <Plus v-if="!isExpanded" class="w-3 h-3 text-fg-muted shrink-0" />
        <Minus v-else class="w-3 h-3 text-fg-muted shrink-0" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.expandable-divider {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
  flex: 1;
  cursor: pointer;
  user-select: none;
}

.expandable-divider__line-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  padding-right: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.expandable-divider__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to left, var(--color-divider), transparent);
}
</style>
