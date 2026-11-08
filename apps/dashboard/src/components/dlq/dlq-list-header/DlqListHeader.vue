<script setup lang="ts">
import Pagination from '@/components/shared/ui/pagination/Pagination.vue';
import PanelHeader from '@/components/shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '@/components/shared/ui/panel-header-title/PanelHeaderTitle.vue';
import type { DlqStatusFilter } from '@/types/dlq-status.model';

import DlqListActions from './dlq-list-actions/DlqListActions.vue';
import type { DlqListHeaderProps } from './DlqListHeader.types';

/**
 * The DLQ list panel header: title, the action cluster (filters, reload,
 * read visibility — `DlqListActions`), and the pagination strip. The
 * header orchestrates; the actions own their filter-menu state.
 */
const props = defineProps<DlqListHeaderProps>();
const filterSearch = defineModel<string>('filterSearch', { required: true });

const emit = defineEmits<{
  (e: 'reload'): void;
  (e: 'update:filterStatus', value: DlqStatusFilter): void;
  (e: 'update:hideRead', value: boolean): void;
  (e: 'firstPage'): void;
  (e: 'prevPage'): void;
  (e: 'nextPage'): void;
  (e: 'lastPage'): void;
  (e: 'setPage', page: number): void;
  (e: 'setPageSize', size: number): void;
}>();
</script>

<template>
  <PanelHeader>
    <div class="dlq-list-header__lead">
      <PanelHeaderTitle :label="$t('common.jobs')" />
    </div>
    <DlqListActions
      v-model:filter-search="filterSearch"
      :filter-status="props.filterStatus"
      :hide-read="props.hideRead"
      :show-loading="props.showLoading"
      @reload="emit('reload')"
      @update:filter-status="emit('update:filterStatus', $event)"
      @update:hide-read="emit('update:hideRead', $event)"
    />
  </PanelHeader>
  <Pagination
    v-if="props.total > 0"
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
</template>

<style scoped>
.dlq-list-header__lead {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
  flex: 1;
}
</style>
