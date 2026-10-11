<script setup lang="ts">
import { ref } from 'vue';

import type { FileInputProps } from './FileInput.types';

const props = defineProps<FileInputProps>();

const emit = defineEmits<{
  select: [files: File[]];
}>();

// The parent's file-select composable clicks this hidden input to open the
// native picker — a genuine imperative DOM handle, exposed for the composable.
const inputRef = ref<HTMLInputElement | null>(null);
defineExpose({ inputRef });

/** Parses the native pick into a File list and clears the input so
 * re-picking the same file fires `change` again. */
function onChange(event: Event) {
  const input = event.target as HTMLInputElement;
  emit('select', input.files ? Array.from(input.files) : []);
  input.value = '';
}
</script>

<template>
  <input
    ref="inputRef"
    type="file"
    name="chat-attachments"
    multiple
    :accept="props.accept"
    class="file-input"
    @change="onChange"
  />
</template>

<style scoped>
.file-input {
  display: none;
}
</style>
