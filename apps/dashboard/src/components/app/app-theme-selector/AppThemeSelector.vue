<script setup lang="ts">
import { Moon, Sun, SwatchBook } from '@lucide/vue';

import MotionIcon from '../../shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '../../shared/ui/tooltip/Tooltip.vue';
import { useThemeSelector } from './composables/use-theme-selector';

const themeSelector = useThemeSelector();

const {
  isDropdownOpen,
  toggleDropdown,
  themes,
  currentTheme,
  isDarkMode,
  selectTheme,
  toggleDarkMode,
} = themeSelector;
</script>

<template>
  <div :ref="themeSelector.containerRef" class="theme-selector">
    <Tooltip :text="$t('app.switchTheme')" :positions="['top', 'bottom']">
      <button
        class="theme-selector__button"
        :class="{ 'theme-selector__button--active': isDropdownOpen }"
        :aria-label="$t('app.switchTheme')"
        @click="toggleDropdown"
      >
        <MotionIcon><SwatchBook :size="16" /></MotionIcon>
      </button>
    </Tooltip>

    <Tooltip
      :text="
        isDarkMode ? $t('app.switchToLightMode') : $t('app.switchToDarkMode')
      "
      :positions="['top', 'bottom']"
    >
      <button
        class="theme-selector__button"
        :aria-label="
          isDarkMode ? $t('app.switchToLightMode') : $t('app.switchToDarkMode')
        "
        @click="toggleDarkMode"
      >
        <MotionIcon>
          <Sun v-if="isDarkMode" :size="14" />
          <Moon v-else :size="14" />
        </MotionIcon>
      </button>
    </Tooltip>

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
            <span class="theme-selector__swatch" :data-theme="theme.key" />
            <span class="theme-selector__name">{{ theme.name }}</span>
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
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-0-5);
}

.theme-selector__button {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: var(--color-fg-secondary);
  background-color: transparent;
  transition: color 0.3s ease;
  cursor: pointer;
}

.theme-selector__button:hover,
.theme-selector__button--active {
  color: var(--color-accent-primary);
}

/* Mouse clicks leave the button focused; the browser's default focus ring
   would linger as a visible box around the icon. Suppress it and keep a
   themed ring for keyboard navigation only. */
.theme-selector__button:focus {
  outline: none;
}

.theme-selector__button:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.theme-selector__dropdown {
  position: absolute;
  right: 100%;
  top: 0;
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
  transition: color 0.15s ease;
  cursor: pointer;
}

.theme-selector__item:hover {
  color: var(--color-fg-primary);
}

.theme-selector__item--active {
  color: var(--color-fg-primary);
  background-color: color-mix(in srgb, var(--color-fg-primary) 5%, transparent);
}

.theme-selector__swatch {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  background-color: var(--color-accent-primary-source);
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--color-fg-inverse) 10%, transparent);
}

.theme-selector__name {
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
