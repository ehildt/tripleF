<script setup lang="ts">
/**
 * The shared chrome row for the settings-family icon rows (top tab menu,
 * sub tab menus, panel action rows): a right-aligned row of MenuButtons
 * over a single underline that runs a bit longer than the buttons and fades
 * out to the left — the one fading ::before segment, continued seamlessly
 * by each MenuButton's own bottom border. Content arrives via the default
 * slot: tab rows are composed by MenuTabs, action rows slot MenuButtons
 * directly. Pure layout chrome — it never styles the slotted buttons.
 */
import type { MenuRowProps } from './MenuRow.types';

defineProps<MenuRowProps>();
</script>

<template>
  <div class="menu-row" :class="`menu-row--${variant}`">
    <slot />
  </div>
</template>

<style scoped>
.menu-row {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  /* No gap: adjacent buttons keep the underline continuous. */
  gap: 0;
}

/* Inside the fixed-height panel header: fill the bar and bottom-align the
   buttons so the underline sits exactly on the bar's bottom edge. The bar
   owns surface and horizontal padding. */
.menu-row--header {
  align-self: stretch;
  align-items: flex-end;
}

/* Standalone strip across a settings section: the secondary surface, the
   standard horizontal inset, and air below the line. */
.menu-row--section {
  padding: 0 var(--spacing-4);
  background-color: var(--color-bg-secondary);
}

/* Action row inside a settings panel: transparent, the same right inset,
   and more air below the line regardless of the panel's own gap. */
.menu-row--panel {
  padding: 0 var(--spacing-4) var(--spacing-4);
}

/* Fading segment left of the buttons: together with the MenuButtons'
   bottom borders it forms one underline, a bit longer than the buttons and
   fading left. */
.menu-row::before {
  content: '';
  width: var(--spacing-6);
  height: 1px;
  flex-shrink: 0;
  align-self: flex-end;
  background: linear-gradient(to right, transparent, var(--color-divider));
}
</style>
