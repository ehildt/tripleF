<script setup lang="ts">
defineProps<{
  content: string;
}>();
</script>

<template>
  <div class="user-request">
    <div class="user-request__body">{{ content }}</div>
  </div>
</template>

<style scoped>
.user-request {
  width: 100%;
}

.user-request__body {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  white-space: pre-line;
}

.user-request__body :deep(> *) {
  flex: 1 1 100%;
  margin-top: 0;
  margin-bottom: 0;
  min-width: 0;
  max-width: 100%;
}
</style>
