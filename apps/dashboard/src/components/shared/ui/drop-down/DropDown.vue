<script setup lang="ts">
import { computed, ref } from 'vue';

import { useMenuPosition } from '@/composables/use-menu-position';
import { stripHtml } from '@/utils/strip-html.helper';

import { useDropdown } from './composables/use-dropdown';
import DropDownItem from './drop-down-item/DropDownItem.vue';
import DropDownTrigger from './drop-down-trigger/DropDownTrigger.vue';
import { displayValue } from './helpers/display-value.helper';
import type { DropDownProps } from './DropDown.types';

const props = withDefaults(defineProps<DropDownProps>(), {
  variant: 'labeled',
  menuStyle: 'default',
  align: 'left',
  side: 'top',
  options: () => [],
  disabled: false,
  placeholder: '',
  formatValue: undefined,
  errored: false,
  size: 'md',
  teleport: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'open'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

// The trigger button lives in the trigger child — read its element handle to
// anchor the menu (the composable only needs the trigger's rect).
const triggerComponentRef = ref<{ triggerEl: HTMLElement | null } | null>(null);
const triggerEl = computed(() => triggerComponentRef.value?.triggerEl ?? null);

const { open, toggle, select, close } = useDropdown(
  containerRef,
  (value: string) => emit('update:modelValue', value),
  () => emit('open'),
  computed(() => props.disabled),
  props.teleport ? dropdownRef : undefined,
);

const { positionStyle } = useMenuPosition(triggerEl, open, {
  side: 'bottom',
});

defineExpose({ close });

/** The labeled trigger's right-hand value text (placeholder/label fallback). */
const triggerValueText = computed(() =>
  displayValue(
    props.modelValue,
    props.placeholder,
    props.label,
    props.formatValue,
  ),
);

/** Option text: formatted when a formatter is given, always plain text. */
function optionLabel(option: string): string {
  return stripHtml(props.formatValue ? props.formatValue(option) : option);
}
</script>

<template>
  <div
    ref="containerRef"
    class="drop-down"
    :class="{ 'drop-down--icon-only': variant === 'icon-only' }"
  >
    <DropDownTrigger
      ref="triggerComponentRef"
      :variant="variant"
      :label="label"
      :value-text="triggerValueText"
      :disabled="disabled"
      :errored="errored"
      :open="open"
      :size="size"
      @toggle="toggle"
    >
      <slot />
      <template #error-icon><slot name="error-icon" /></template>
    </DropDownTrigger>
    <Teleport to="body" :disabled="!teleport">
      <Transition name="drop-down">
        <div
          v-if="open"
          ref="dropdownRef"
          class="drop-down__menu"
          :class="[
            side === 'top' ? 'drop-down__menu--top' : 'drop-down__menu--bottom',
            align === 'left'
              ? 'drop-down__menu--left'
              : align === 'center'
                ? 'drop-down__menu--center'
                : 'drop-down__menu--right',
            variant === 'icon-only' && 'drop-down__menu--icon-only',
            menuStyle === 'centered' && 'drop-down__menu--centered',
            $slots.menu && 'drop-down__menu--rich',
            teleport && 'drop-down__menu--teleported',
          ]"
          :style="teleport ? (positionStyle ?? undefined) : undefined"
          @click.stop
        >
          <slot name="menu" :close="close">
            <DropDownItem
              v-for="opt in options"
              :key="opt"
              :option="opt"
              :label="optionLabel(opt)"
              :selected="modelValue === opt"
              :show-check="variant !== 'icon-only' && menuStyle !== 'centered'"
              @select="select"
            />
          </slot>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.drop-down {
  position: relative;
  flex: 1;
  min-width: 0;
  height: fit-content;
}

.drop-down--icon-only {
  flex: none;
  min-width: 0;
}

.drop-down__menu {
  position: absolute;
  z-index: 50;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
  max-height: 8rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.drop-down__menu::-webkit-scrollbar {
  width: 0.375rem;
}

.drop-down__menu::-webkit-scrollbar-track {
  background: transparent;
}

.drop-down__menu::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
}

.drop-down-enter-active,
.drop-down-leave-active {
  transition:
    max-height 150ms ease,
    opacity 150ms ease;
  overflow: hidden;
}

.drop-down-enter-from,
.drop-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.drop-down-enter-to,
.drop-down-leave-from {
  max-height: 8rem;
  opacity: 1;
}

.drop-down__menu--left {
  left: 0;
  right: auto;
}

/* Field-style (labeled) triggers span their container, so the option list
   matches the trigger width instead of shrinking to the option text — the
   same width the combo-box menus in the same panel use. */
.drop-down:not(.drop-down--icon-only) .drop-down__menu--left {
  right: 0;
}

.drop-down__menu--center {
  left: 50%;
  transform: translateX(-50%);
  right: auto;
}

.drop-down__menu--right {
  left: auto;
  right: 0;
}

.drop-down__menu--top {
  bottom: 100%;
  margin-bottom: var(--spacing-1);
}

/* Centered menus (the chat menu's context select) mirror the model-list
   panels: the list itself is the scroll container, capped at the same
   height, with the app-wide accent scrollbar — the default option list
   keeps its own thin muted scrollbar — but without the model list's sticky
   search header. */
.drop-down__menu--centered {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-1);
  max-height: min(24rem, 70vh);
  scrollbar-width: auto;
}

.drop-down__menu--centered::-webkit-scrollbar {
  width: 0.5rem;
}

.drop-down__menu--centered::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

.drop-down__menu--centered::-webkit-scrollbar-thumb {
  background: var(--color-accent-primary);
}

.drop-down__menu--centered::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-secondary);
}

/* Grow up to the menu's own cap: the shared enter target (8rem) would clamp
   the taller centered menu mid-animation. */
.drop-down__menu--centered.drop-down-enter-to,
.drop-down__menu--centered.drop-down-leave-from {
  max-height: min(24rem, 70vh);
}

.drop-down__menu--bottom {
  top: 100%;
  margin-top: var(--spacing-1);
}

.drop-down__menu--icon-only {
  /* Shrink-to-fit the widest option row — the strip dropdowns size to their
     content, like the model list's rows. */
  width: auto;
  white-space: nowrap;
}

/* Slotted rich menus (e.g. the searchable model list) size and scroll their
   own content — drop the item-list height cap and fade instead of animating
   the height. */
.drop-down__menu--rich {
  width: 14rem;
  max-height: none;
  overflow: visible;
}

/* Teleported menus are fixed-positioned by useMenuPosition (anchored below
   the trigger) instead of absolutely positioned within the trigger. */
.drop-down__menu--teleported {
  position: fixed;
}

.drop-down__menu--rich.drop-down-enter-active,
.drop-down__menu--rich.drop-down-leave-active {
  transition: opacity 150ms ease;
  overflow: visible;
}

.drop-down__menu--rich.drop-down-enter-from,
.drop-down__menu--rich.drop-down-leave-to,
.drop-down__menu--rich.drop-down-enter-to,
.drop-down__menu--rich.drop-down-leave-from {
  max-height: none;
}

/* Icon-only menus are compact single-line lists — center the option text. */
.drop-down__menu--icon-only .drop-down-item {
  justify-content: center;
  text-align: center;
}

/* Centered menus render the options as model-list style card rows. */
.drop-down__menu--centered .drop-down-item {
  width: 100%;
  box-sizing: border-box;
  justify-content: flex-start;
  padding: var(--spacing-2);
  text-align: left;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
}

.drop-down__menu--centered .drop-down-item:hover {
  background-color: color-mix(
    in srgb,
    var(--color-bg-tertiary) 80%,
    transparent
  );
}

/* Strip dropdowns (icon-only + centered cards): the option text centers in
   its card, keeping the compact single-line behavior of the icon-only look. */
.drop-down__menu--icon-only.drop-down__menu--centered .drop-down-item {
  justify-content: center;
  text-align: center;
}
</style>
