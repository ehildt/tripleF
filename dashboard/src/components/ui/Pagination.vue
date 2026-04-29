<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-vue-next';
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
  <div
    class="flex items-center justify-between px-4 py-3 bg-secondary border-t border-divider"
  >
    <span class="text-[10px] font-mono text-fg-muted">
      {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
    </span>

    <div class="flex items-center gap-1">
      <button
        class="px-2 py-1 text-fg-muted hover:text-fg-primary transition-colors disabled:opacity-30"
        :disabled="currentPage <= 1"
        @click="$emit('first')"
      >
        <ChevronsLeft class="w-3.5 h-3.5" />
      </button>
      <button
        class="px-2 py-1 text-fg-muted hover:text-fg-primary transition-colors disabled:opacity-30"
        :disabled="currentPage <= 1"
        @click="$emit('prev')"
      >
        <ChevronLeft class="w-3.5 h-3.5" />
      </button>

      <template v-for="(page, idx) in displayedPages" :key="idx">
        <button
          v-if="typeof page === 'number'"
          class="min-w-6 px-1.5 py-0.5 text-[10px] font-mono transition-colors"
          :class="
            page === currentPage
              ? 'text-fg-inverse bg-accent-primary'
              : 'text-fg-muted hover:text-fg-primary'
          "
          @click="$emit('page', page)"
        >
          {{ page }}
        </button>
        <span v-else class="px-1 py-0.5 text-[10px] font-mono text-fg-muted"
          >...</span
        >
      </template>

      <button
        class="px-2 py-1 text-fg-muted hover:text-fg-primary transition-colors disabled:opacity-30"
        :disabled="currentPage >= totalPages"
        @click="$emit('next')"
      >
        <ChevronRight class="w-3.5 h-3.5" />
      </button>
      <button
        class="px-2 py-1 text-fg-muted hover:text-fg-primary transition-colors disabled:opacity-30"
        :disabled="currentPage >= totalPages"
        @click="$emit('last')"
      >
        <ChevronsRight class="w-3.5 h-3.5" />
      </button>
    </div>

    <div class="flex items-center gap-0.5">
      <button
        v-for="size in pageSizes"
        :key="size"
        class="px-1.5 py-0.5 text-[10px] font-mono transition-colors"
        :class="
          size === limit
            ? 'text-fg-inverse bg-accent-primary'
            : 'text-fg-muted hover:text-fg-primary'
        "
        @click="$emit('setPageSize', size)"
      >
        {{ size }}
      </button>
    </div>
  </div>
</template>
