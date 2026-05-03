export function getMethodTabBorderColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'border-tab-rest/50';
    case 'POST':
      return 'border-tab-accent/50';
    case 'PUT':
      return 'border-tab-debug/50';
    case 'DELETE':
      return 'border-tab-rest/50';
    case 'PATCH':
      return 'border-tab-accent/50';
    default:
      return 'border-tab-debug/50';
  }
}
