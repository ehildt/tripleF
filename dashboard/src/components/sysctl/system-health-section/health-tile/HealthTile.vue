<script setup lang="ts">
import {
  Activity,
  Brain,
  Cpu,
  Database,
  FolderOpen,
  HardDrive,
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
  <div class="health-tile" :style="{ ...tileBackStyle, ...borderStyle }">
    <div class="health-tile__main">
      <Icon class="health-tile__icon" :style="statusColorStyle" />
      <span class="health-tile__name">
        {{ name }}
      </span>
    </div>
    <span class="health-tile__status" :style="statusColorStyle">
      {{ displayStatus }}
    </span>
  </div>
</template>

<style scoped>
.health-tile {
  height: 2.5rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-1) 0.625rem;
  gap: var(--spacing-2);
  border-width: 1px;
  border-style: solid;
}

.health-tile__main {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.health-tile__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.health-tile__name {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fg-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: text;
}

.health-tile__status {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  flex-shrink: 0;
  user-select: text;
}
</style>
