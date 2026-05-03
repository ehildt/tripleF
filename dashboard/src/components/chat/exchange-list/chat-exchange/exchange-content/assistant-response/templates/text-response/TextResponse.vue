<script setup lang="ts">
import { computed } from 'vue';

import { extractHarnessText } from '../../composables/helpers/extract-harness-text.helper';

const props = defineProps<{
  text?: string;
}>();

const displayText = computed(() => extractHarnessText(props.text ?? ''));
</script>

<template>
  <div v-if="displayText" class="response-container">
    <section class="response-text">{{ displayText }}</section>
  </div>
</template>

<style scoped>
.response-container {
  line-height: 1.65;
}

.response-container p {
  margin: 0 0 0.75em;
}

.response-container p:last-child {
  margin-bottom: 0;
}
</style>
