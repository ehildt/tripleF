<script setup lang="ts">
import CapabilityBadge from '../shared/ui/capability-badge/CapabilityBadge.vue';

defineProps<{
  capabilities: readonly string[];
}>();
</script>

<template>
  <div class="capabilities-row">
    <CapabilityBadge v-for="cap in capabilities" :key="cap" :capability="cap" />
  </div>
</template>

<style scoped>
.capabilities-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  justify-content: flex-end;
  padding: var(--spacing-2);
}
</style>
