import { computed } from 'vue';

import type { HealthTileProps } from '../HealthTile.types';
import { resolveHealthTileIcon } from '../helpers/resolve-health-tile-icon.helper';

/**
 * Derives the health tile's display state from its props: the healthy
 * status, the per-name icon, and the border/status colors for the loading,
 * error, and healthy states.
 */
export function useHealthTile(props: HealthTileProps) {
  const isHealthy = computed(
    () => props.status === 'up' || props.status === 'ok',
  );

  const Icon = computed(() => resolveHealthTileIcon(props.name));

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

  return {
    isHealthy,
    Icon,
    borderStyle,
    statusColorStyle,
    tileBackStyle,
    displayStatus,
  };
}
