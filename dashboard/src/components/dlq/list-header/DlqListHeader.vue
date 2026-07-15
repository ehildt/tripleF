<script setup lang="ts">
import { CircleAlert, Eye, EyeOff, ListOrdered, Search } from '@lucide/vue';
import { ref } from 'vue';

import Pagination from '../../shared/ui/pagination/Pagination.vue';
import PanelHeader from '../../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import DlqReloadButton from '../shared/ui/reload-button/DlqReloadButton.vue';
import { useExclusiveFilterMenu } from './composables/use-exclusive-filter-menu';
import DlqFilterMenu from './filter-menu/DlqFilterMenu.vue';

const props = defineProps<{
  showLoading: boolean;
  filterStatus: string;
  filterQueue: string;
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
  (e: 'update:filterQueue', value: string): void;
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

const statusOptions = ['Failed', 'Active', 'Cleared', 'Removed'] as const;
const queueOptions = ['harness'] as const;

const { isMenuOpen, toggleMenu } = useExclusiveFilterMenu(headerRef, [
  'status',
  'queue',
  'search',
]);

function selectStatus(value: string) {
  emit('update:filterStatus', value);
  toggleMenu('status');
}

function selectQueue(value: string) {
  emit('update:filterQueue', value);
  toggleMenu('queue');
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
      <PanelHeaderTitle label="Jobs" />
    </div>
    <div class="dlq-list-header__actions">
      <DlqFilterMenu
        :is-open="isMenuOpen('status')"
        :is-active="props.filterStatus !== ''"
        :icon="CircleAlert"
        title="Filter by status"
        width="8rem"
        :options="statusOptions"
        :selected-value="props.filterStatus"
        @toggle="toggleMenu('status')"
        @select="selectStatus"
      />
      <DlqFilterMenu
        :is-open="isMenuOpen('queue')"
        :is-active="props.filterQueue !== ''"
        :icon="ListOrdered"
        title="Filter by queue"
        width="8rem"
        :options="queueOptions"
        :selected-value="props.filterQueue"
        @toggle="toggleMenu('queue')"
        @select="selectQueue"
      />
      <DlqFilterMenu
        :is-open="isMenuOpen('search')"
        :is-active="props.filterSearch !== ''"
        :icon="Search"
        title="Search"
        width="16rem"
        :options="[]"
        :selected-value="props.filterSearch"
        has-text-value
        @toggle="toggleMenu('search')"
        @select="selectSearch"
      />
      <DlqReloadButton :loading="props.showLoading" @click="emit('reload')" />
      <div class="dlq-list-header__divider" />
      <button
        class="dlq-list-header__hide-read"
        :class="{
          'dlq-list-header__hide-read--active': props.hideRead,
        }"
        @click="toggleHideRead"
      >
        <Eye v-if="props.hideRead" class="dlq-list-header__hide-read-icon" />
        <EyeOff v-else class="dlq-list-header__hide-read-icon" />
      </button>
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

.dlq-list-header__divider {
  width: 1px;
  height: 1.25rem;
  background-color: var(--color-divider);
}

.dlq-list-header__hide-read {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-0-5) var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.dlq-list-header__hide-read:hover {
  color: var(--color-fg-primary);
}

.dlq-list-header__hide-read--active {
  color: var(--color-accent-primary);
}

.dlq-list-header__hide-read-icon {
  width: 1rem;
  height: 1rem;
}
</style>
