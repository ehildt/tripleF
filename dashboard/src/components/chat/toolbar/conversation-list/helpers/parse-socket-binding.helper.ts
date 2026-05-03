/**
 * Parse a socket binding string into its event and optional roomId.
 * Format: "event" or "event::roomId".
 */
export function parseSocketBinding(binding: string): {
  event: string;
  roomId: string;
} {
  const parts = binding.split('::');
  if (parts.length === 2) {
    return { event: parts[0], roomId: parts[1] || '' };
  }
  return { event: binding, roomId: '' };
}
