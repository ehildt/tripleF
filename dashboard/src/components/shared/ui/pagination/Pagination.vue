<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  offset: number;
}>();

defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'first'): void;
  (e: 'last'): void;
  (e: 'page', page: number): void;
  (e: 'setPageSize', size: number): void;
}>();

const pageSizes = [5, 10, 20, 50];

const rangeStart = computed(() => (props.total === 0 ? 0 : props.offset + 1));
const rangeEnd = computed(() =>
  Math.min(props.offset + props.limit, props.total),
);

const displayedPages = computed(() => {
  const pages: (number | string)[] = [];
  const maxVisible = 5;
  if (props.totalPages <= maxVisible) {
    for (let i = 1; i <= props.totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  let start = Math.max(2, props.currentPage - 1);
  let end = Math.min(props.totalPages - 1, props.currentPage + 1);
  if (props.currentPage <= 3) {
    start = 2;
    end = Math.min(props.totalPages - 1, 4);
  }
  if (props.currentPage >= props.totalPages - 2) {
    start = Math.max(2, props.totalPages - 3);
    end = props.totalPages - 1;
  }
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < props.totalPages - 1) pages.push('...');
  pages.push(props.totalPages);
  return pages;
});
</script>

<template>
  <div class="pagination">
    <span class="pagination__range">
      {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
    </span>

    <div class="pagination__pages">
      <button
        class="pagination__button"
        :disabled="currentPage <= 1"
        title="First page"
        @click="$emit('first')"
      >
        <ChevronsLeft class="pagination__icon" />
      </button>
      <button
        class="pagination__button"
        :disabled="currentPage <= 1"
        title="Previous page"
        @click="$emit('prev')"
      >
        <ChevronLeft class="pagination__icon" />
      </button>

      <template v-for="(page, idx) in displayedPages" :key="idx">
        <button
          v-if="typeof page === 'number'"
          class="pagination__page"
          :class="{ 'pagination__page--active': page === currentPage }"
          @click="$emit('page', page)"
        >
          {{ page }}
        </button>
        <span v-else class="pagination__ellipsis">...</span>
      </template>

      <button
        class="pagination__button"
        :disabled="currentPage >= totalPages"
        title="Next page"
        @click="$emit('next')"
      >
        <ChevronRight class="pagination__icon" />
      </button>
      <button
        class="pagination__button"
        :disabled="currentPage >= totalPages"
        title="Last page"
        @click="$emit('last')"
      >
        <ChevronsRight class="pagination__icon" />
      </button>
    </div>

    <div class="pagination__sizes">
      <button
        v-for="size in pageSizes"
        :key="size"
        class="pagination__page"
        :class="{ 'pagination__page--active': size === limit }"
        :title="`${size} per page`"
        @click="$emit('setPageSize', size)"
      >
        {{ size }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-bg-secondary);
}

.pagination__range {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}

.pagination__pages,
.pagination__sizes {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.pagination__sizes {
  gap: var(--spacing-0-5);
}

.pagination__button {
  padding: var(--spacing-1) var(--spacing-2);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.pagination__button:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.pagination__button:disabled {
  opacity: 0.3;
  cursor: default;
}

.pagination__icon {
  width: 0.875rem;
  height: 0.875rem;
}

.pagination__page {
  min-width: 1.5rem;
  padding: var(--spacing-0-5) var(--spacing-1-5);
  border: none;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.pagination__page:hover:not(.pagination__page--active) {
  color: var(--color-fg-primary);
}

.pagination__page--active {
  background-color: var(--color-accent-primary);
  color: var(--color-fg-inverse);
}

.pagination__ellipsis {
  padding: var(--spacing-0-5) var(--spacing-1);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}
</style>
