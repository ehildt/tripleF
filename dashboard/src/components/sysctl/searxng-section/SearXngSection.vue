<script setup lang="ts">
import SwitchCard from '../shared/ui/switch-card/SwitchCard.vue';
import type { SearXNGConfig } from '../sysctl-config.model';

defineProps<{
  config: SearXNGConfig;
}>();

const emit = defineEmits<{
  toggleEnabled: [];
  updateResults: [value: string];
}>();
</script>

<template>
  <div class="searxng-section__content">
    <div class="searxng-section__grid">
      <SwitchCard
        label="enabled"
        description="Search results"
        :checked="config.enabled"
        :has-results="true"
        :results="config.results"
        @toggle="emit('toggleEnabled')"
        @update-results="emit('updateResults', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.searxng-section__content {
  padding: var(--spacing-4);
}

.searxng-section__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-3);
}
</style>
