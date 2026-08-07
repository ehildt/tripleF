<script setup lang="ts">
import { ChevronsDown, ChevronsUp } from '@lucide/vue';
import { computed, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { ActiveTab } from '../../../stores/app';
import Tooltip from '../../shared/ui/tooltip/Tooltip.vue';
import AppThemeSelector from '../app-theme-selector/AppThemeSelector.vue';
import LanguageSelector from '../language-selector/LanguageSelector.vue';
import { useMenuTabs } from './composables/use-menu-tabs';
import { useTabMenu } from './composables/use-tab-menu';
import NavMenu from './nav-menu/NavMenu.vue';

const props = defineProps<{
  activeTab: ActiveTab;
  debugCount: number;
  showChatStar?: boolean;
  dlqCount?: number;
}>();

const { tabs } = useMenuTabs(props);

const menuRef = useTemplateRef<HTMLElement>('menuRef');
const { isOpen, side, toggleMenu, closeOnAutoclose } = useTabMenu(menuRef);

/** Down to expand (the drawer drops below), up to slide it away again. */
const handleIcon = computed(() => (isOpen.value ? ChevronsUp : ChevronsDown));

/**
 * The handle tooltip opens toward the page (away from the docked edge): to
 * the left when the menu is on the right, to the right when on the left.
 */
const handleTooltipPositions = computed(() =>
  side.value === 'left' ? ['right', 'left'] : ['left', 'right'],
);

// Navigation happens through the router now (NavMenu renders router-links), so
// close the drawer when the route changes instead of on a click event.
const route = useRoute();
watch(
  () => route.fullPath,
  () => closeOnAutoclose(),
);
</script>

<template>
  <header
    ref="menuRef"
    class="tab-menu"
    :class="[`tab-menu--${side}`, { 'tab-menu--closed': !isOpen }]"
  >
    <Tooltip
      :text="$t('app.toggleTabMenu')"
      :positions="handleTooltipPositions"
    >
      <button
        type="button"
        class="tab-menu__handle shadow-floating"
        aria-label="$t('app.toggleTabMenu')"
        :aria-expanded="isOpen"
        @click="toggleMenu"
      >
        <component :is="handleIcon" class="tab-menu__handle-icon" />
      </button>
    </Tooltip>

    <aside
      class="tab-menu__drawer shadow-floating"
      :aria-label="$t('common.tabMenuTitle')"
    >
      <NavMenu :tabs="tabs" :active-tab="activeTab" />
      <hr />
      <div class="tab-menu__footer">
        <AppThemeSelector />
        <LanguageSelector />
      </div>
    </aside>
  </header>
</template>

<style scoped>
/* A compact vertical menu anchored near the top corner — 1% off the top
   edge, 1% off the docked screen edge (vh/vw so the slide math stays
   exact). The arrow bar on top toggles the drawer below it. Collapsed,
   only the bar remains; a click drops the drawer smoothly into view. */
.tab-menu {
  position: fixed;
  top: 2vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  /* Above every overlay the menu can collide with: floating players
     (1000), teleported dropdowns (1050), the lightbox (1100). */
  z-index: 1200;
}

.tab-menu--right {
  right: 1vw;
}

.tab-menu--left {
  left: 1vw;
}

/* Frosted-glass surface, like the original floating header pill: solid
   blur, no borders, just the floating shadow for depth. The clip reveal
   sweeps open from the arrow bar downward; the open state's generous
   negative inset keeps the theme dropdown outside the drawer visible. */
.tab-menu__drawer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  width: 3.25rem;
  padding: var(--spacing-3) 0;
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 50%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  clip-path: inset(-16rem);
  opacity: 1;
  visibility: visible;
  transition:
    clip-path 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.24s ease,
    visibility 0s;
}

/* Collapsed: the reveal sweeps back up into the arrow bar — the sheet
   expands from the bar and collapses into it, never sliding past. */
.tab-menu--closed .tab-menu__drawer {
  clip-path: inset(0 0 100% 0);
  opacity: 0;
  visibility: hidden;
  transition:
    clip-path 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.24s ease,
    visibility 0s linear 0.28s;
}

.tab-menu__footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1-5);
  width: 100%;
  padding-top: var(--spacing-2);
}

/* Same tile rhythm as the nav items above the divider. */
.tab-menu__footer :deep(.theme-selector__button) {
  width: 2.25rem;
  height: 2.25rem;
}

/* On the left edge the theme dropdown must extend rightward to stay on
   screen; on the right edge (default) it opens to the left of the menu. */
.tab-menu--left .tab-menu__footer :deep(.theme-selector__dropdown) {
  right: auto;
  left: 0;
}

/* Arrow bar on top of the menu — collapsed it points down, and the
   drawer expands downward from it. Same frosted glass, no border. */
.tab-menu__handle {
  flex-shrink: 0;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  color: var(--color-fg-muted);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 50%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  transition: color 0.2s ease;
}

.tab-menu__handle:hover {
  color: var(--color-accent-primary);
}

.tab-menu__handle:focus {
  outline: none;
}

.tab-menu__handle:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -2px;
}

.tab-menu__handle-icon {
  width: 0.9rem;
  height: 0.9rem;
}
</style>
