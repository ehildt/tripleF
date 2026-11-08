<script setup lang="ts">
import { ListFilter, Mail, MailOpen, Search } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import DlqReloadButton from '@/components/dlq/shared/ui/dlq-reload-button/DlqReloadButton.vue';
import FilterMenu from '@/components/shared/ui/filter-menu/FilterMenu.vue';
import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import TextFilterMenu from '@/components/shared/ui/text-filter-menu/TextFilterMenu.vue';
import type { DlqStatusFilter } from '@/types/dlq-status.model';

import { useExclusiveFilterMenu } from '../composables/use-exclusive-filter-menu';
import type {
  DlqListActionsEmits,
  DlqListActionsProps,
} from './DlqListActions.types';

/**
 * The DLQ list header's action cluster: explicit status and search filters,
 * reload, and read visibility. At most one filter menu is open; each menu's
 * trigger owns the transparent backdrop that closes it on an outside click.
 */
const props = defineProps<DlqListActionsProps>();
const filterSearch = defineModel<string>('filterSearch', { required: true });
const emit = defineEmits<DlqListActionsEmits>();

const { t } = useI18n();

const statusOptions = computed(() => [
  { value: 'Failed', label: t('common.failed') },
  { value: 'Active', label: t('common.active') },
  { value: 'Cleared', label: t('common.cleared') },
  { value: 'Removed', label: t('common.removed') },
]);

const { isMenuOpen, toggleMenu, closeAllMenus } = useExclusiveFilterMenu([
  'status',
  'search',
]);

function isDlqStatusFilter(value: string): value is DlqStatusFilter {
  return (
    value === '' ||
    value === 'Failed' ||
    value === 'Active' ||
    value === 'Cleared' ||
    value === 'Removed'
  );
}

function selectStatus(value: string) {
  if (!isDlqStatusFilter(value)) return;
  emit('update:filterStatus', value);
  toggleMenu('status');
}
</script>

<template>
  <div class="dlq-list-actions">
    <FilterMenu
      :is-open="isMenuOpen('status')"
      :is-active="props.filterStatus !== ''"
      :title="$t('common.filterByStatus')"
      width="8rem"
      :options="statusOptions"
      :selected-value="props.filterStatus"
      :icon="ListFilter"
      @toggle="toggleMenu('status')"
      @close="closeAllMenus"
      @select="selectStatus"
    />
    <TextFilterMenu
      v-model="filterSearch"
      :is-open="isMenuOpen('search')"
      :is-active="filterSearch !== ''"
      :title="$t('common.search')"
      width="16rem"
      :icon="Search"
      @toggle="toggleMenu('search')"
      @close="closeAllMenus"
    />
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
.dlq-list-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
</style>
