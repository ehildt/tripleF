<script setup lang="ts">
import InputText from '@/components/shared/ui/input-text/InputText.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type { TextFieldCardProps } from './TextFieldCard.types';

/**
 * Full-width setting row carrying a single-line text field: icon tile,
 * label + description, and a borderless InputText as the inline control.
 * Used for API keys, hosts, zone names and other free-text settings. The
 * input commits on blur/Enter (`onCommit`); the value syncs per keystroke
 * via `v-model`. Autocomplete is off and spellcheck disabled — these cards
 * carry secrets and identifiers, never prose.
 */
withDefaults(defineProps<TextFieldCardProps>(), {
  disabled: false,
});

const model = defineModel<string>({ required: true });
</script>

<template>
  <div class="text-field-card">
    <div class="text-field-card__icon">
      <component :is="icon" class="text-field-card__icon-glyph" />
    </div>

    <div class="text-field-card__content">
      <Tooltip :text="label" max-width="16rem">
        <span class="text-field-card__label">{{ label }}</span>
      </Tooltip>
      <Tooltip v-if="description" :text="description" max-width="20rem">
        <span class="text-field-card__description">{{ description }}</span>
      </Tooltip>
    </div>

    <div class="text-field-card__field">
      <InputText
        v-model="model"
        variant="borderless"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        :spellcheck="false"
        @change="onCommit?.($event)"
        @focus="onFocus?.($event)"
      />
    </div>
  </div>
</template>

<style scoped>
.text-field-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-tertiary);
  transition:
    background-color 0.2s ease,
    filter 0.2s ease;
}

.text-field-card:hover {
  filter: brightness(1.08);
}

/* The hover filter above makes every card its own stacking context — an
   open dropdown inside one card would paint under the cards after it.
   While focus is inside, lift the card. */
.text-field-card:focus-within {
  position: relative;
  z-index: 20;
}

.text-field-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.text-field-card__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.text-field-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.text-field-card__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-field-card__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Inline box — the card background is the field's frame (borderless input) */
.text-field-card__field {
  flex: 1;
  min-width: 0;
  padding: 0 var(--spacing-1);
  background-color: var(--color-bg-secondary);
}
</style>
