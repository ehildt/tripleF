<script setup lang="ts">
import { CircleAlert, Mail, MailOpen, Search } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import DlqReloadButton from '@/components/dlq/shared/ui/dlq-reload-button/DlqReloadButton.vue';
import FilterMenu from '@/components/shared/ui/filter-menu/FilterMenu.vue';
import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import { useExclusiveFilterMenu } from '../composables/use-exclusive-filter-menu';
import type {
  DlqListActionsEmits,
  DlqListActionsProps,
} from './DlqListActions.types';

/**
 * The DLQ list header's action cluster: status and search filter menus (at
 * most one open at a time, closed by the transparent backdrop on the first
 * outside click), the reload button, and the read/unread visibility toggle.
 * The backdrop and the actions bar live together so their z-index pairing
 * (backdrop beneath, actions above) is one component's concern.
 */
const props = defineProps<DlqListActionsProps>();

const emit = defineEmits<DlqListActionsEmits>();

const { t } = useI18n();

const statusOptions = computed(() => [
  { value: 'Failed', label: t('common.failed') },
  { value: 'Active', label: t('common.active') },
  { value: 'Cleared', label: t('common.cleared') },
  { value: 'Removed', label: t('common.removed') },
]);

const { isMenuOpen, isAnyMenuOpen, toggleMenu, closeAllMenus } =
  useExclusiveFilterMenu(['status', 'search']);

function selectStatus(value: string) {
  emit('update:filterStatus', value);
  toggleMenu('status');
}
</script>

<template>
  <!-- Transparent click-catcher while a filter menu is open: the first
       outside click closes the menu. Sits below the actions so the
       triggers stay clickable. -->
  <div
    v-if="isAnyMenuOpen"
    class="dlq-list-actions__backdrop"
    @click="closeAllMenus"
  />
  <div class="dlq-list-actions">
    <FilterMenu
      :is-open="isMenuOpen('status')"
      :is-active="props.filterStatus !== ''"
      :title="$t('common.filterByStatus')"
      width="8rem"
      :options="statusOptions"
      :selected-value="props.filterStatus"
      @toggle="toggleMenu('status')"
      @select="selectStatus"
    >
      <CircleAlert />
    </FilterMenu>
    <FilterMenu
      :is-open="isMenuOpen('search')"
      :is-active="props.filterSearch !== ''"
      :title="$t('common.search')"
      width="16rem"
      :options="[]"
      :selected-value="props.filterSearch"
      has-text-value
      @toggle="toggleMenu('search')"
      @select="emit('update:filterSearch', $event)"
    >
      <Search />
    </FilterMenu>
    <DlqReloadButton :loading="props.showLoading" @click="emit('reload')" />
    <IconButton
      :active="props.hideRead"
      :title="
        props.hideRead
          ? $t('common.showReadRequests')
          : $t('common.hideReadRequests')
      "
      @click="emit('update:hideRead', !props.hideRead)"
    >
      <Mail v-if="props.hideRead" />
      <MailOpen v-if="!props.hideRead" />
    </IconButton>
  </div>
</template>

<style scoped>
/* Fixed transparent click-catcher — closes the open filter menu on the
   first outside click (slide-over/lightbox pattern). */
.dlq-list-actions__backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: transparent;
}

.dlq-list-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  /* Above the menu backdrop: the triggers and the open filter panel (z-50
     inside this context) stay clickable while the menu is open. */
  position: relative;
  z-index: 41;
}
</style>
