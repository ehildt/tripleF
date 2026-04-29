<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue';
import { Check, ChevronDown } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  blinking?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder || 'Select...';
  return props.modelValue;
});
</script>

<template>
  <Listbox
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="relative w-full">
      <ListboxButton
        :class="[
          'w-full px-3 py-2 bg-secondary border rounded-none text-sm text-fg-primary text-left focus:outline-none transition-all font-mono cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pr-10',
          'hover:border-[var(--color-accent-active)]/50',
          blinking
            ? 'animate-pulse ring-2 ring-[var(--color-accent-active)] border-[var(--color-accent-active)]'
            : 'border-divider',
        ]"
      >
        <span class="flex items-center gap-2">
          <slot name="prepend-icon" />
          <span :class="!modelValue ? 'text-fg-muted' : ''">
            {{ displayValue }}
          </span>
        </span>
        <ChevronDown
          class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-fg-muted"
        />
      </ListboxButton>
      <ListboxOptions
        class="absolute z-50 w-full mt-1 bg-secondary border border-divider rounded-none shadow-lg max-h-60 overflow-auto focus:outline-none"
      >
        <ListboxOption
          v-for="option in options"
          :key="option"
          v-slot="{ active, selected }"
          :value="option"
        >
          <li
            :class="[
              'px-3 py-2 text-sm font-mono cursor-pointer flex items-center justify-between',
              selected
                ? 'bg-[var(--color-accent-active)] text-[var(--color-fg-inverse)]'
                : active
                  ? 'bg-[var(--color-accent-active)]/20 text-fg-primary'
                  : 'text-fg-primary',
            ]"
          >
            <span>{{ option }}</span>
            <Check v-if="selected" class="w-4 h-4" />
          </li>
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>
