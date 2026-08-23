<script setup lang="ts">
/** Prompt input block: the mono ">" caret plus the multiline textarea. */
defineProps<{
  value: string;
}>();

const emit = defineEmits<{
  input: [event: Event];
  keydown: [event: KeyboardEvent];
  focus: [];
}>();
</script>

<template>
  <div class="prompt-input">
    <span class="prompt-input__caret">&gt;</span>
    <textarea
      :value="value"
      name="prompt"
      :rows="2"
      class="prompt-input__field"
      :aria-label="$t('common.promptAria')"
      :placeholder="$t('common.askHarness')"
      @input="emit('input', $event)"
      @keydown="emit('keydown', $event)"
      @focus="emit('focus')"
    />
  </div>
</template>

<style scoped>
.prompt-input {
  display: flex;
  flex: 1 1 0%;
  align-items: flex-start;
  gap: var(--spacing-3);
  min-width: 0;
}

.prompt-input__caret {
  color: var(--color-tab-rest);
  font-family: var(--font-mono);
  line-height: 1.5rem;
  user-select: none;
}

.prompt-input__field {
  flex: 1 1 0%;
  min-width: 0;
  background-color: transparent;
  border: none;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  resize: none;
  outline: none;
  caret-shape: block;
}

.prompt-input__field::placeholder {
  color: var(--color-fg-muted);
}

.prompt-input__field:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
