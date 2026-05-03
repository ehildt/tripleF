<script setup lang="ts">
import Debug from '../../../../components/debug/Debug.vue';
import RequestDetails from '../../../../components/debug/request-details/RequestDetails.vue';

defineProps<{
  debugResults: any[];
  selectedDebugResult: any | null;
}>();

const emit = defineEmits<{
  clearDebugResults: [];
  selectDebugResult: [result: any];
  selectDebugMarkRead: [id: string];
}>();
</script>

<template>
  <div class="lg:col-span-6 h-fit lg:sticky lg:top-24">
    <Debug
      :results="debugResults"
      :selected-result="selectedDebugResult"
      @clear="emit('clearDebugResults')"
      @select="emit('selectDebugResult', $event)"
      @mark-read="emit('selectDebugMarkRead', $event)"
    />
  </div>
  <div class="lg:col-span-6 h-fit lg:sticky lg:top-24">
    <RequestDetails :result="selectedDebugResult" />
  </div>
</template>

<style scoped>
.debug-section {
  display: contents;
}
</style>
