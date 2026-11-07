import type { DlqStatus } from '../../../types/dlq-status.model';

export function getDlqStatusColor(status: DlqStatus): string {
  switch (status) {
    case 'Failed':
      return 'dlq-status-badge--failed';
    case 'Active':
      return 'dlq-status-badge--active';
    case 'Cleared':
      return 'dlq-status-badge--cleared';
    case 'Removed':
      return 'dlq-status-badge--removed';
    default:
      return 'dlq-status-badge--unknown';
  }
}
