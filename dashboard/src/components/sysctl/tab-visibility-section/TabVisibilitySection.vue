<script setup lang="ts">
import SwitchCard from '../shared/ui/switch-card/SwitchCard.vue';

defineProps<{
  isPreprocessingVisible: boolean;
  isDebugVisible: boolean;
  isDlqVisible: boolean;
  showCounters: boolean;
}>();

const emit = defineEmits<{
  togglePreprocessing: [];
  toggleDebug: [];
  toggleDlq: [];
  toggleCounters: [];
}>();
</script>

<template>
  <div class="tab-visibility-section__content">
    <div class="tab-visibility-section__grid">
      <SwitchCard
        label="pproc"
        description="preprocessing tab"
        :checked="isPreprocessingVisible"
        @toggle="emit('togglePreprocessing')"
      />
      <SwitchCard
        label="dlq"
        description="dead letter queue tab"
        :checked="isDlqVisible"
        @toggle="emit('toggleDlq')"
      />
      <SwitchCard
        label="debug"
        description="debug tab / logging"
        :checked="isDebugVisible"
        @toggle="emit('toggleDebug')"
      />
      <SwitchCard
        label="counters"
        description="show unread badge on tabs"
        :checked="showCounters"
        @toggle="emit('toggleCounters')"
      />
    </div>
  </div>
</template>

<style scoped>
.tab-visibility-section__content {
  padding: var(--spacing-4);
}

.tab-visibility-section__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-3);
}
</style>
