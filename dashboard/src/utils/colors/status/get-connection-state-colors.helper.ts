export function getConnectionStateColors(
  state: 'connected' | 'disconnected' | 'error',
) {
  switch (state) {
    case 'connected':
      return { text: 'text-connection-connected' };
    case 'disconnected':
      return { text: 'text-connection-disconnected' };
    case 'error':
      return { text: 'text-connection-error' };
    default:
      return { text: 'text-connection-default' };
  }
}
