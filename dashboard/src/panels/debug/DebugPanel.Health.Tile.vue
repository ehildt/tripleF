<script setup lang="ts">
import {
  Activity,
  Brain,
  Cpu,
  Database,
  FolderOpen,
  HardDrive,
  Server,
} from 'lucide-vue-next';
import { computed } from 'vue';

import { useThemeStore } from '../../stores/theme';

const props = defineProps<{
  name: string;
  status: string;
  loading: boolean;
  error: boolean;
}>();

const themeStore = useThemeStore();

const primaryColor = computed(
  () => themeStore.themeColors[themeStore.currentTheme].primary,
);

const Icon = computed(() => {
  switch (props.name) {
    case 'disk':
      return HardDrive;
    case 'ollama':
      return Brain;
    case 'memory_heap':
    case 'memory_rss':
      return Cpu;
    case 'postgres':
      return Database;
    case 'minio':
      return FolderOpen;
    case 'service':
      return Activity;
    default:
      return Server;
  }
});

function tileGradient() {
  return `linear-gradient(to right, ${primaryColor.value}30, transparent)`;
}

function borderClass() {
  if (props.loading) return 'border border-divider';
  if (props.error) return 'border border-status-error/50';
  if (props.status === 'up' || props.status === 'ok')
    return 'border border-status-success/40';
  return 'border border-status-error/50';
}

function statusClass() {
  if (props.loading) return 'text-fg-muted';
  if (props.error) return 'text-status-error';
  if (props.status === 'up' || props.status === 'ok')
    return 'text-status-success';
  return 'text-status-error';
}

const displayStatus = computed(() => {
  if (props.loading) return '...';
  if (props.error) return 'ERR';
  return props.status;
});
</script>

<template>
  <div
    class="h-10 overflow-hidden flex items-center justify-between px-2.5 py-1 gap-2"
    :class="borderClass()"
    :style="{ background: tileGradient() }"
  >
    <div class="flex items-center gap-2 min-w-0">
      <Icon class="w-3.5 h-3.5 shrink-0" :class="statusClass()" />
      <span
        class="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-primary truncate select-text"
      >
        {{ name }}
      </span>
    </div>
    <span
      class="text-[10px] font-mono shrink-0 select-text"
      :class="statusClass()"
    >
      {{ displayStatus }}
    </span>
  </div>
</template>
