export function getMethodTabColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'text-tab-rest';
    case 'POST':
      return 'text-tab-accent';
    case 'PUT':
      return 'text-tab-debug';
    case 'DELETE':
      return 'text-tab-rest';
    case 'PATCH':
      return 'text-tab-accent';
    default:
      return 'text-tab-debug';
  }
}
