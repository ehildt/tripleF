import type { DlqStatus } from '../../../types/dlq-status.model';

export function getDlqStatusColor(status: DlqStatus): string {
  switch (status) {
    case 'Failed':
      return 'text-[var(--color-tab-debug)] border-[var(--color-tab-debug)]/40';
    case 'Active':
      return 'text-status-success border-status-success/40';
    case 'Cleared':
      return 'text-[var(--color-tab-debug)]/60 border-[var(--color-tab-debug)]/20';
    case 'Removed':
      return 'text-status-error/60 border-status-error/30';
    default:
      return 'text-fg-muted border-divider';
  }
}
