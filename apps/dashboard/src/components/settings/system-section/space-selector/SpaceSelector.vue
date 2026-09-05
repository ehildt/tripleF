<script setup lang="ts">
import { Check, ChevronDown, Search, X } from '@lucide/vue';
import { ref, toRef } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import { useSpaceSelector } from './composables/use-space-selector';
import type {
  SpaceSelectorEmits,
  SpaceSelectorProps,
} from './SpaceSelector.types';

/**
 * Cognition-space picker for the settings System tab — modeled on the
 * language menu: a trigger button in the FieldCard's field slot, a
 * teleported dropdown with a sticky search/create input and the history
 * list. Selecting activates a space, typing an unknown name and confirming
 * creates it (spaces are implicit keys — selection is creation), the per-
 * item X drops a space from the list without touching its data; the empty
 * pseudo-option restores the default (cognition lives in the partition).
 */
const props = defineProps<SpaceSelectorProps>();
const emit = defineEmits<SpaceSelectorEmits>();

const containerRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

const {
  isOpen,
  searchQuery,
  positionStyle,
  filteredSpaces,
  creatableSpace,
  toggleMenu,
  closeMenu,
} = useSpaceSelector(toRef(props, 'spaces'), {
  containerRef,
  triggerRef,
  dropdownRef,
});

function selectSpace(space: string) {
  emit('select', space);
  closeMenu();
}

function createSpace() {
  if (creatableSpace.value) emit('create', creatableSpace.value);
  closeMenu();
}

/** The IconButton click bubbles to the item — stop it from selecting. */
function removeSpace(event: MouseEvent, space: string) {
  event.stopPropagation();
  emit('remove', space);
}
</script>

<template>
  <div ref="containerRef" class="space-selector">
    <button
      ref="triggerRef"
      type="button"
      class="space-selector__trigger"
      :class="{ 'space-selector__trigger--active': isOpen }"
      :title="$t('common.memoryCognitionSpacesLabel')"
      :aria-label="$t('common.memoryCognitionSpacesLabel')"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="toggleMenu"
    >
      <span
        class="space-selector__trigger-label"
        :class="{ 'space-selector__trigger-label--default': !activeSpace }"
      >
        {{ activeSpace || $t('common.memoryCognitionSpaceDefault') }}
      </span>
      <ChevronDown class="space-selector__trigger-chevron" />
    </button>

    <!-- Teleported to <body>: the FieldCard's hover filter would otherwise
         paint an open dropdown under the cards after it. -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="space-selector__dropdown"
          :style="positionStyle ?? undefined"
          role="listbox"
          :aria-label="$t('common.memoryCognitionSpacesLabel')"
        >
          <div class="space-selector__content">
            <div class="space-selector__search">
              <Search class="space-selector__search-icon" :size="14" />
              <input
                v-model="searchQuery"
                class="space-selector__search-input"
                type="text"
                :placeholder="$t('common.memoryCognitionSpaceSearch')"
                :aria-label="$t('common.memoryCognitionSpaceSearch')"
                spellcheck="false"
                @keydown.enter="createSpace"
              />
            </div>
            <div class="space-selector__items">
              <div
                v-if="!searchQuery.trim()"
                class="space-selector__item"
                :class="{
                  'space-selector__item--active': activeSpace === '',
                }"
                role="option"
                :aria-selected="activeSpace === ''"
                tabindex="0"
                @click="selectSpace('')"
                @keydown.enter="selectSpace('')"
              >
                <Check
                  v-if="activeSpace === ''"
                  class="space-selector__check"
                />
                <span class="space-selector__name">{{
                  $t('common.memoryCognitionSpaceDefault')
                }}</span>
              </div>

              <div
                v-for="space in filteredSpaces"
                :key="space"
                class="space-selector__item"
                :class="{
                  'space-selector__item--active': activeSpace === space,
                }"
                role="option"
                :aria-selected="activeSpace === space"
                tabindex="0"
                @click="selectSpace(space)"
                @keydown.enter="selectSpace(space)"
              >
                <Check
                  v-if="activeSpace === space"
                  class="space-selector__check"
                />
                <span class="space-selector__name">{{ space }}</span>
                <IconButton
                  :title="$t('common.memoryCognitionSpaceRemove')"
                  size="sm"
                  @click="removeSpace($event, space)"
                >
                  <X />
                </IconButton>
              </div>

              <div
                v-if="creatableSpace"
                class="space-selector__item space-selector__item--create"
                role="option"
                :aria-selected="false"
                tabindex="0"
                @click="createSpace"
                @keydown.enter="createSpace"
              >
                <span class="space-selector__name space-selector__name--create">
                  {{
                    $t('common.memoryCognitionSpaceCreate', {
                      text: creatableSpace,
                    })
                  }}
                </span>
              </div>

              <p
                v-if="
                  !creatableSpace &&
                  !searchQuery.trim() &&
                  !filteredSpaces.length
                "
                class="space-selector__empty"
              >
                {{ $t('common.memoryCognitionSpacesEmpty') }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.space-selector {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 1.75rem;
  justify-content: center;
}

/* Trigger: fills the FieldCard field box like the former text input. */
.space-selector__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1);
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.space-selector__trigger:hover {
  color: var(--color-accent-primary);
}

.space-selector__trigger:focus {
  outline: none;
}

.space-selector__trigger:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.space-selector__trigger-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-selector__trigger-label--default {
  color: var(--color-fg-muted);
  font-size: 0.7rem;
}

.space-selector__trigger-chevron {
  flex-shrink: 0;
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-fg-muted);
}

/* Teleported dropdown, matching the language menu's elevated surface. */
.space-selector__dropdown {
  position: fixed;
  width: 16rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
  /* Above the floating overlays the drop-down can collide with. */
  z-index: 1300;
}

.space-selector__content {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  max-height: min(24rem, 70vh);
}

/* Sticky search header, styled like the language menu's search bar. */
.space-selector__search {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  margin-bottom: var(--spacing-1);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
  z-index: 1;
}

.space-selector__search-icon {
  flex-shrink: 0;
  color: var(--color-fg-muted);
}

.space-selector__search-input {
  flex: 1;
  min-width: 0;
  padding: 0.25rem 0;
  border: none;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-primary);
}

.space-selector__search-input:focus {
  outline: none;
}

.space-selector__search-input::placeholder {
  color: var(--color-fg-muted);
}

/* Card list, matching the language menu's item rhythm. */
.space-selector__items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding-inline: var(--spacing-1);
  padding-bottom: var(--spacing-1);
}

.space-selector__empty {
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  text-align: center;
  margin: 0;
}

/* Card item, matching the language menu's surface and selection. */
.space-selector__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: var(--spacing-2);
  text-align: left;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.space-selector__item:hover,
.space-selector__item:focus-visible {
  background-color: color-mix(
    in srgb,
    var(--color-bg-tertiary) 80%,
    transparent
  );
  outline: none;
}

.space-selector__item--active {
  color: var(--color-accent-primary);
}

.space-selector__item--create {
  color: var(--color-accent-primary);
  border-style: dashed;
}

.space-selector__check {
  flex-shrink: 0;
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-accent-primary);
}

.space-selector__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-selector__name--create {
  text-align: center;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
