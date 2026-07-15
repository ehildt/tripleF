<script setup lang="ts">
import { Moon, Sun, SwatchBook } from '@lucide/vue';

import { useThemeSelector } from './composables/use-theme-selector';

const themeSelector = useThemeSelector();

const {
  isDropdownOpen,
  toggleDropdown,
  currentPrimary,
  themes,
  currentTheme,
  isDarkMode,
  selectTheme,
  toggleDarkMode,
} = themeSelector;
</script>

<template>
  <div :ref="themeSelector.containerRef" class="theme-selector">
    <button
      class="theme-selector__button"
      :class="{ 'theme-selector__button--active': isDropdownOpen }"
      :style="{ borderColor: currentPrimary }"
      title="Switch theme"
      @click="toggleDropdown"
    >
      <SwatchBook :size="16" />
    </button>

    <button
      class="theme-selector__button"
      :style="{ borderColor: currentPrimary }"
      :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleDarkMode"
    >
      <component :is="isDarkMode ? Moon : Sun" :size="14" />
    </button>

    <Transition name="dropdown">
      <div v-if="isDropdownOpen" class="theme-selector__dropdown">
        <div class="theme-selector__list">
          <button
            v-for="theme in themes"
            :key="theme.key"
            class="theme-selector__item"
            :class="{
              'theme-selector__item--active': currentTheme === theme.key,
            }"
            @click="selectTheme(theme.key)"
          >
            <span
              class="theme-selector__swatch"
              :style="{ backgroundColor: theme.primary }"
            />
            <span class="theme-selector__name">{{ theme.name }}</span>
            <span
              v-if="currentTheme === theme.key"
              class="theme-selector__check"
              >✓</span
            >
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.theme-selector {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.theme-selector__button {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  color: var(--color-fg-secondary);
  background-color: transparent;
  transition:
    color 0.3s ease,
    background-color 0.3s ease,
    border-color 0.3s ease;
  cursor: pointer;
}

.theme-selector__button:hover,
.theme-selector__button--active {
  color: var(--color-fg-primary);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 50%,
    transparent
  );
}

.theme-selector__dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  width: 11rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
  box-shadow: 0 20px 25px -5px
    color-mix(in srgb, var(--color-bg-primary) 20%, transparent);
  z-index: 50;
}

.theme-selector__list {
  max-height: 16rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-right: 0.375rem;
}

.theme-selector__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-align: left;
  color: var(--color-fg-muted);
  background-color: transparent;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
  cursor: pointer;
}

.theme-selector__item:hover {
  color: var(--color-fg-primary);
  background-color: var(--color-bg-tertiary);
}

.theme-selector__item--active {
  color: var(--color-fg-primary);
  background-color: color-mix(in srgb, var(--color-fg-primary) 5%, transparent);
}

.theme-selector__swatch {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--color-fg-inverse) 10%, transparent);
}

.theme-selector__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-selector__check {
  margin-left: auto;
  flex-shrink: 0;
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
