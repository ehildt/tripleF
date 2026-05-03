<script setup lang="ts">
import {
  Activity,
  Brain,
  Cpu,
  Database,
  FolderOpen,
  HardDrive,
  Search,
  Server,
} from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  status: string;
  loading: boolean;
  error: boolean;
}>();

const isHealthy = computed(
  () => props.status === 'up' || props.status === 'ok',
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
    case 'searxng':
      return Search;
    case 'service':
      return Activity;
    default:
      return Server;
  }
});

const borderStyle = computed(() => {
  if (props.loading) return { borderColor: 'var(--color-divider)' };
  if (props.error || !isHealthy.value)
    return { borderColor: 'var(--color-status-error)' };
  return { borderColor: 'var(--color-accent-primary)' };
});

const statusColorStyle = computed(() => {
  if (props.loading) return { color: 'var(--color-fg-muted)' };
  if (props.error || !isHealthy.value)
    return { color: 'var(--color-status-error)' };
  return { color: 'var(--color-accent-primary)' };
});

const tileBackStyle = computed(() => ({
  background:
    'linear-gradient(to right, color-mix(in srgb, var(--color-accent-primary) 12%, transparent), transparent)',
}));

const displayStatus = computed(() => {
  if (props.loading) return '...';
  if (props.error) return 'ERR';
  return props.status;
});
</script>

<template>
  <div
    class="h-10 overflow-hidden flex items-center justify-between px-2.5 py-1 gap-2 border"
    :style="{ ...tileBackStyle, ...borderStyle }"
  >
    <div class="flex items-center gap-2 min-w-0">
      <Icon class="w-4 h-4 shrink-0" :style="statusColorStyle" />
      <span
        class="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-primary truncate select-text"
      >
        {{ name }}
      </span>
    </div>
    <span
      class="text-[10px] font-mono shrink-0 select-text"
      :style="statusColorStyle"
    >
      {{ displayStatus }}
    </span>
  </div>
</template>
