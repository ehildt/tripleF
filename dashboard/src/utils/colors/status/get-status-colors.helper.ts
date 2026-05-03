export function getStatusColors(status: 'success' | 'error') {
  return {
    bg: status === 'success' ? 'bg-status-success/5' : 'bg-status-error/5',
    indicatorBg:
      status === 'success' ? 'bg-accent-primary/20' : 'bg-status-error/20',
    text: status === 'success' ? 'text-status-success' : 'text-status-error',
    border:
      status === 'success'
        ? 'border-status-success/50'
        : 'border-status-error/50',
    indicatorText:
      status === 'success' ? 'text-accent-primary' : 'text-status-error',
  };
}
