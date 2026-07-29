<script setup lang="ts">
import type { ActiveTab } from '../../../../stores/app';
import type { MenuTab } from '../composables/use-menu-tabs';

defineProps<{
  tabs: readonly MenuTab[];
  activeTab: ActiveTab;
}>();

const emit = defineEmits<{
  tabChange: [tab: ActiveTab];
}>();
</script>

<template>
  <nav class="nav-menu" aria-label="Navigation">
    <button
      v-for="tab in tabs"
      :key="tab.tab"
      type="button"
      class="nav-menu__item"
      :class="{ 'nav-menu__item--active': tab.tab === activeTab }"
      :aria-current="tab.tab === activeTab"
      :title="tab.label"
      :aria-label="tab.label"
      @click="emit('tabChange', tab.tab)"
    >
      <component :is="tab.icon" class="nav-menu__item-icon" />
      <span
        v-if="tab.tab !== activeTab && (tab.count ?? 0) > 0"
        class="nav-menu__badge"
      >
        {{ tab.count! > 99 ? '99+' : tab.count }}
      </span>
      <span
        v-else-if="tab.tab !== activeTab && tab.showStar"
        class="nav-menu__badge nav-menu__badge--star"
      >
        ✦
      </span>
    </button>
  </nav>
</template>

<style scoped>
/* Vertical destination rail inside the slide-out drawer. */
.nav-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1-5);
}

.nav-menu__item {
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
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.nav-menu__item:hover {
  color: var(--color-fg-primary);
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
}

/* Active destination: an accent icon on a soft tinted wash — no ring, no
   border. */
.nav-menu__item--active,
.nav-menu__item--active:hover {
  color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 16%,
    transparent
  );
}

/* Mouse clicks leave the button focused; keep a themed ring for keyboard
   navigation only. */
.nav-menu__item:focus {
  outline: none;
}

.nav-menu__item:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.nav-menu__item-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Corner badges inside the larger tile. */
.nav-menu__badge {
  position: absolute;
  top: -0.25rem;
  right: -0.3125rem;
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

.nav-menu__badge--star {
  top: -0.25rem;
  right: -0.125rem;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  font-size: 0.625rem;
  color: var(--color-fg-primary);
}
</style>
