export function getTagColorClasses(
  variant: 'type' | 'direction' | 'status',
  value: string,
): { border: string; text: string; bg: string } {
  switch (variant) {
    case 'type':
      return value === 'socket'
        ? {
            border: 'border-tab-rest/50',
            text: 'text-tab-rest',
            bg: 'bg-tab-rest/10',
          }
        : {
            border: 'border-tab-accent/50',
            text: 'text-tab-accent',
            bg: 'bg-tab-accent/10',
          };
    case 'direction':
      return value === 'response'
        ? {
            border: 'border-tab-rest/50',
            text: 'text-tab-rest',
            bg: 'bg-tab-rest/10',
          }
        : {
            border: 'border-tab-accent/50',
            text: 'text-tab-accent',
            bg: 'bg-tab-accent/10',
          };
    case 'status':
      return value === 'success'
        ? {
            border: 'border-tab-rest/50',
            text: 'text-tab-rest',
            bg: 'bg-tab-rest/10',
          }
        : {
            border: 'border-tab-debug/50',
            text: 'text-tab-debug',
            bg: 'bg-tab-debug/10',
          };
    default:
      return {
        border: 'border-tab-debug/50',
        text: 'text-tab-debug',
        bg: 'bg-tab-debug/10',
      };
  }
}
