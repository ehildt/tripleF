<script setup lang="ts">
import Switch from '../switch/Switch.vue';

defineProps<{
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  hasResults?: boolean;
  results?: number;
  maxResults?: number;
}>();

const emit = defineEmits<{
  toggle: [];
  updateResults: [value: string];
}>();
</script>

<template>
  <div class="switch-card" :class="{ 'switch-card--disabled': disabled }">
    <div class="switch-card__row">
      <Switch
        :checked="checked"
        :disabled="disabled"
        @toggle="emit('toggle')"
      />
      <span class="switch-card__label">{{ label }}</span>
      <input
        v-if="hasResults"
        type="number"
        class="switch-card__input"
        :value="results"
        :disabled="disabled"
        min="1"
        :max="maxResults ?? 200"
        @input="
          emit('updateResults', ($event.target as HTMLInputElement).value)
        "
      />
      <div v-else class="switch-card__input-spacer" />
    </div>
    <p v-if="description" class="switch-card__description">
      {{ description }}
    </p>
  </div>
</template>

<style scoped>
.switch-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  min-height: 4.25rem;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-primary);
}

.switch-card--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.switch-card__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  min-width: 0;
  min-height: 1.75rem;
}

.switch-card__label {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-secondary);
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.switch-card__input {
  width: 3rem;
  height: 1.5rem;
  margin-top: var(--spacing-0-5);
  margin-right: var(--spacing-0-5);
  padding: 0 var(--spacing-1);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-primary);
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-align: center;
  flex-shrink: 0;
}

.switch-card__input-spacer {
  width: 3rem;
  height: 1.5rem;
  margin-top: var(--spacing-0-5);
  margin-right: var(--spacing-0-5);
  flex-shrink: 0;
}

.switch-card__input:focus {
  outline: none;
  border-color: var(--color-tab-rest);
}

.switch-card__input:disabled {
  opacity: 0.4;
}

.switch-card__description {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: color-mix(in srgb, var(--color-fg-muted) 60%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
