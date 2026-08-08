<script setup lang="ts">
import { CircleAlert, Mail, MailOpen, Search } from '@lucide/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import FilterMenu from '../../shared/ui/filter-menu/FilterMenu.vue';
import IconButton from '../../shared/ui/icon-button/IconButton.vue';
import Pagination from '../../shared/ui/pagination/Pagination.vue';
import PanelHeader from '../../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import DlqReloadButton from '../shared/ui/reload-button/DlqReloadButton.vue';
import { useExclusiveFilterMenu } from './composables/use-exclusive-filter-menu';

const props = defineProps<{
  showLoading: boolean;
  filterStatus: string;
  filterSearch: string;
  hideRead: boolean;
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  offset: number;
}>();

const emit = defineEmits<{
  (e: 'reload'): void;
  (e: 'update:filterStatus', value: string): void;
  (e: 'update:filterSearch', value: string): void;
  (e: 'update:hideRead', value: boolean): void;
  (e: 'firstPage'): void;
  (e: 'prevPage'): void;
  (e: 'nextPage'): void;
  (e: 'lastPage'): void;
  (e: 'setPage', page: number): void;
  (e: 'setPageSize', size: number): void;
}>();

const headerRef = ref<HTMLElement | null>(null);

const { t } = useI18n();

const statusOptions = computed(() => [
  { value: 'Failed', label: t('common.failed') },
  { value: 'Active', label: t('common.active') },
  { value: 'Cleared', label: t('common.cleared') },
  { value: 'Removed', label: t('common.removed') },
]);

const { isMenuOpen, toggleMenu } = useExclusiveFilterMenu(headerRef, [
  'status',
  'search',
]);

function selectStatus(value: string) {
  emit('update:filterStatus', value);
  toggleMenu('status');
}

function selectSearch(value: string) {
  emit('update:filterSearch', value);
}

function toggleHideRead() {
  emit('update:hideRead', !props.hideRead);
}
</script>

<template>
  <PanelHeader>
    <div ref="headerRef" class="dlq-list-header__lead">
      <PanelHeaderTitle :label="$t('common.jobs')" />
    </div>
    <div class="dlq-list-header__actions">
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
        @select="selectSearch"
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
        @click="toggleHideRead"
      >
        <Mail v-if="props.hideRead" />
        <MailOpen v-else />
      </IconButton>
    </div>
  </PanelHeader>
  <div v-if="props.total > 0">
    <Pagination
      :current-page="props.currentPage"
      :total-pages="props.totalPages"
      :total="props.total"
      :limit="props.limit"
      :offset="props.offset"
      @first="emit('firstPage')"
      @prev="emit('prevPage')"
      @next="emit('nextPage')"
      @last="emit('lastPage')"
      @page="emit('setPage', $event)"
      @set-page-size="emit('setPageSize', $event)"
    />
  </div>
</template>

<style scoped>
.dlq-list-header__lead {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
  flex: 1;
}

.dlq-list-header__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
</style>
