<script setup lang="ts">
import { Languages, Search } from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { useLocale } from '../../../i18n/composables/use-locale';
import { resolveNativeLanguageName } from '../../../i18n/resolve-native-language-name';
import MotionIcon from '../../shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '../../shared/ui/tooltip/Tooltip.vue';

const { locale, setLocale, supportedLocales } = useLocale();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const searchQuery = ref('');

/** Locale options with their native (endonym) name, from Intl.DisplayNames. */
const allOptions = computed(() =>
  supportedLocales.map((code) => ({
    code,
    name: resolveNativeLanguageName(code),
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
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
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

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="language-selector__dropdown"
        role="listbox"
        :aria-label="$t('app.selectLanguage')"
      >
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
          <span class="language-selector__code">{{ option.code }}</span>
          <span class="language-selector__name">{{ option.name }}</span>
        </button>
      </div>
    </Transition>
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

/* Opens to the left of the menu rail (right edge by default), like the
   theme dropdown — the drawer is only 3.25rem wide. */
.language-selector__dropdown {
  position: absolute;
  right: 100%;
  top: 0;
  width: 12.5rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
  box-shadow: 0 20px 25px -5px
    color-mix(in srgb, var(--color-bg-primary) 20%, transparent);
  max-height: 20rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  z-index: 50;
}

.language-selector__search {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
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

.language-selector__empty {
  margin: 0;
  padding: 0.625rem 0.75rem;
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.language-selector__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  text-align: left;
  color: var(--color-fg-muted);
  background-color: transparent;
  transition: color 0.15s ease;
  cursor: pointer;
}

.language-selector__item:hover,
.language-selector__item--active {
  color: var(--color-fg-primary);
}

.language-selector__item--active {
  background-color: color-mix(in srgb, var(--color-fg-primary) 5%, transparent);
}

.language-selector__code {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  border: 1px solid var(--color-divider);
  padding: 0 var(--spacing-0-5);
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
