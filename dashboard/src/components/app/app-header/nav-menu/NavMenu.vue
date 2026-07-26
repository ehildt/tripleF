<script setup lang="ts">
import { Menu } from '@lucide/vue';

import type { ActiveTab } from '../../../../../stores/app';
import type { HeaderTab } from '../../composables/use-header-tabs';
import { useNavMenu } from './composables/use-nav-menu';

const props = defineProps<{
  tabs: readonly HeaderTab[];
  activeTab: ActiveTab;
}>();

const emit = defineEmits<{
  tabChange: [tab: ActiveTab];
}>();

const {
  containerRef,
  isOpen,
  pendingCount,
  hasPendingStar,
  toggleMenu,
  selectTab,
} = useNavMenu(props, emit);
</script>

<template>
  <div ref="containerRef" class="nav-menu">
    <button
      type="button"
      class="nav-menu__burger"
      :class="{ 'nav-menu__burger--open': isOpen }"
      title="Navigation"
      aria-label="Navigation menu"
      :aria-expanded="isOpen"
      @click="toggleMenu"
    >
      <Menu class="nav-menu__burger-icon" />
      <span v-if="pendingCount > 0" class="nav-menu__badge">
        {{ pendingCount > 99 ? '99+' : pendingCount }}
      </span>
      <span
        v-else-if="hasPendingStar"
        class="nav-menu__badge nav-menu__badge--dot"
      />
    </button>

    <Transition name="nav-menu-dropdown">
      <div v-if="isOpen" class="nav-menu__dropdown shadow-floating">
        <button
          v-for="tab in tabs"
          :key="tab.tab"
          type="button"
          class="nav-menu__item"
          :class="{ 'nav-menu__item--active': tab.tab === activeTab }"
          @click="selectTab(tab.tab)"
        >
          <component :is="tab.icon" class="nav-menu__item-icon" />
          <span class="nav-menu__item-label">{{ tab.label }}</span>
          <span
            v-if="tab.tab !== activeTab && tab.showStar"
            class="nav-menu__item-star"
          >
            ✦
          </span>
          <span
            v-if="tab.tab !== activeTab && (tab.count ?? 0) > 0"
            class="nav-menu__item-count"
          >
            {{ tab.count! > 99 ? '99+' : tab.count }}
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.nav-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.nav-menu__burger {
  position: relative;
  overflow: visible;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: var(--color-fg-muted);
  background-color: transparent;
  cursor: pointer;
  transition: color 0.2s ease;
}

.nav-menu__burger:hover,
.nav-menu__burger--open {
  color: var(--color-accent-primary);
}

/* Accumulated pending count badge — plain dot when only the chat
   star is pending. Same corner placement + pulse the tab counters used. */
.nav-menu__badge {
  position: absolute;
  top: -0.375rem;
  right: -0.375rem;
  min-width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-0-5);
  font-size: 0.5625rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  background-color: var(--color-accent-active);
  border: 1px solid color-mix(in srgb, var(--color-fg-primary) 20%, transparent);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.nav-menu__badge--dot {
  top: 0.2rem;
  right: 0.2rem;
  width: 0.375rem;
  height: 0.375rem;
  min-width: 0;
  padding: 0;
  border-radius: 50%;
}

.nav-menu__burger-icon {
  width: 1rem;
  height: 1rem;
}

.nav-menu__dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  z-index: 50;
}

.nav-menu__item {
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
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.nav-menu__item:hover {
  color: var(--color-fg-primary);
  background-color: var(--color-bg-tertiary);
}

.nav-menu__item--active {
  color: var(--color-fg-primary);
  background-color: color-mix(in srgb, var(--color-fg-primary) 5%, transparent);
}

.nav-menu__item-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.nav-menu__item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-menu__item-star {
  flex-shrink: 0;
  font-size: 0.625rem;
  color: var(--color-fg-primary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.nav-menu__item-count {
  flex-shrink: 0;
  min-width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-0-5);
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--color-fg-primary);
  background-color: var(--color-accent-active);
  border: 1px solid color-mix(in srgb, var(--color-fg-primary) 20%, transparent);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.nav-menu-dropdown-enter-active,
.nav-menu-dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.nav-menu-dropdown-enter-from,
.nav-menu-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
