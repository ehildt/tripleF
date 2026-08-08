<script setup lang="ts">
import { Globe, Languages, Search } from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { useLocale } from '../../../i18n/composables/use-locale';
import { resolveLocaleFlag } from '../../../i18n/resolve-locale-flag';
import { resolveNativeLanguageName } from '../../../i18n/resolve-native-language-name';
import { useMenuPosition } from '../../chat/toolbar/model-selector/composables/use-menu-position';
import MotionIcon from '../../shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '../../shared/ui/tooltip/Tooltip.vue';
import LocaleFlag from './LocaleFlag.vue';

const { locale, setLocale, supportedLocales } = useLocale();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const searchQuery = ref('');

// Teleported to <body> so the drawer's clip-path/backdrop-filter can't clip
// the dropdown (the model menu does the same). Opens to the left of the rail.
const { positionStyle } = useMenuPosition(triggerRef, isOpen, {
  align: 'left',
});

/** Locale options with their native (endonym) name, from Intl.DisplayNames. */
const allOptions = computed(() =>
  supportedLocales.map((code) => ({
    code,
    name: resolveNativeLanguageName(code),
    flag: resolveLocaleFlag(code),
  })),
);

/** Options filtered by the search query (name or code, case-insensitive). */
const options = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return allOptions.value;
  return allOptions.value.filter(
    (option) =>
      option.name.toLowerCase().includes(q) ||
      option.code.toLowerCase().includes(q),
  );
});

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) searchQuery.value = '';
}

function select(code: (typeof supportedLocales)[number]) {
  setLocale(code);
  isOpen.value = false;
}

function onDocumentMousedown(event: MouseEvent) {
  const target = event.target as Node;
  const insideContainer = containerRef.value?.contains(target);
  const insideDropdown = dropdownRef.value?.contains(target);
  if (!insideContainer && !insideDropdown) {
    isOpen.value = false;
  }
}

onMounted(() => document.addEventListener('mousedown', onDocumentMousedown));
onUnmounted(() =>
  document.removeEventListener('mousedown', onDocumentMousedown),
);
</script>

<template>
  <div ref="containerRef" class="language-selector">
    <Tooltip :text="$t('app.selectLanguage')" :positions="['top', 'bottom']">
      <button
        ref="triggerRef"
        class="language-selector__button"
        :class="{ 'language-selector__button--active': isOpen }"
        :aria-label="$t('app.selectLanguage')"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
        @click="toggle"
      >
        <MotionIcon><Languages :size="16" /></MotionIcon>
      </button>
    </Tooltip>

    <!-- Teleported to <body> so the drawer's clip-path/backdrop-filter can't
         clip the dropdown (the model menu does the same). -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="language-selector__dropdown"
          :style="positionStyle ?? undefined"
          role="listbox"
          :aria-label="$t('app.selectLanguage')"
        >
          <div class="language-selector__content">
            <div class="language-selector__search">
              <Search class="language-selector__search-icon" :size="14" />
              <input
                v-model="searchQuery"
                class="language-selector__search-input"
                type="text"
                :placeholder="$t('common.searchLanguages')"
                aria-label="$t('common.searchLanguages')"
              />
            </div>
            <div class="language-selector__items">
              <p v-if="!options.length" class="language-selector__empty">
                {{ $t('common.noMatchingRequests') }}
              </p>
              <button
                v-for="option in options"
                :key="option.code"
                class="language-selector__item"
                :class="{
                  'language-selector__item--active': locale === option.code,
                }"
                role="option"
                :aria-selected="locale === option.code"
                @click="select(option.code)"
              >
                <LocaleFlag v-if="option.flag" :country="option.flag" />
                <Globe v-else class="language-selector__flag-fallback" />
                <span class="language-selector__code">{{ option.code }}</span>
                <div class="language-selector__info">
                  <span class="language-selector__name">{{ option.name }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.language-selector {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.language-selector__button {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: var(--color-fg-secondary);
  background-color: transparent;
  transition: color 0.3s ease;
  cursor: pointer;
}

.language-selector__button:hover,
.language-selector__button--active {
  color: var(--color-accent-primary);
}

.language-selector__button:focus {
  outline: none;
}

.language-selector__button:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: 2px;
}

/* Teleported to <body> and fixed-positioned by useMenuPosition (opens to
   the left of the rail). Matches the model selector's elevated surface,
   soft shadow, and stacking level. The surface itself does not scroll; the
   inner .language-selector__content does, so the list's bottom padding stays
   visible at the end of the scrollbar. */
.language-selector__dropdown {
  position: fixed;
  width: 14rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
  /* Above the tab menu it lives in (1200) and every overlay the menu can
     collide with (floating players 1000, teleported dropdowns 1050, the
     lightbox 1100). The model menu's 1050 is fine there because it sits in
     the chat toolbar, not inside the tab menu. */
  z-index: 1300;
}

/* Scroll container, matching the model list's .model-list-content: the
   dropdown surface stays fixed while this inner column scrolls. */
.language-selector__content {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  max-height: min(24rem, 70vh);
}

/* Sticky search header, styled like the model list's search bar. */
.language-selector__search {
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

.language-selector__search-icon {
  flex-shrink: 0;
  color: var(--color-fg-muted);
}

.language-selector__search-input {
  flex: 1;
  min-width: 0;
  padding: 0.25rem 0;
  border: none;
  background: none;
  font-size: 0.75rem;
  color: var(--color-fg-primary);
}

.language-selector__search-input:focus {
  outline: none;
}

.language-selector__search-input::placeholder {
  color: var(--color-fg-muted);
}

/* Card list, matching the model list's item rhythm. */
.language-selector__items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding-inline: var(--spacing-1);
  padding-bottom: var(--spacing-1);
}

.language-selector__empty {
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
}

/* Card item, matching the model list item's surface and selection. */
.language-selector__item {
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
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.language-selector__item:hover {
  background-color: color-mix(
    in srgb,
    var(--color-bg-tertiary) 80%,
    transparent
  );
}

.language-selector__item--active {
  color: var(--color-accent-primary);
}

.language-selector__flag-fallback {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
}

.language-selector__code {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}

.language-selector__item--active .language-selector__code {
  color: var(--color-accent-primary);
}

/* Stretched column, left-aligned via the button's text-align. */
.language-selector__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.language-selector__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
