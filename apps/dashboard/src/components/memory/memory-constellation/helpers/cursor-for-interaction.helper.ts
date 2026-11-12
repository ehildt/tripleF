/**
 * The canvas cursor for one frame: grabbing while the camera drags or pans,
 * pointer over a dot with a click action (details or expand/collapse), grab
 * otherwise (the scene invites rotation).
 */
export function cursorForInteraction(
  interacting: boolean,
  hasClickAction: boolean,
): string {
  if (interacting) return 'grabbing';
  return hasClickAction ? 'pointer' : 'grab';
}
