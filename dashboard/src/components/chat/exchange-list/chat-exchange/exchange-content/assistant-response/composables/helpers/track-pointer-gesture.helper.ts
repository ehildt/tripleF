/**
 * Track a drag/resize gesture on `target` using pointer capture, so the
 * gesture keeps working (and always finishes) even when the pointer moves
 * over an embedded iframe, which would otherwise swallow the pointerup.
 */
export function trackPointerGesture(
  target: HTMLElement,
  event: PointerEvent,
  onMove: (move: PointerEvent) => void,
  onEnd?: () => void,
) {
  target.setPointerCapture(event.pointerId);

  const onGestureEnd = (end: PointerEvent) => {
    if (target.hasPointerCapture(end.pointerId)) {
      target.releasePointerCapture(end.pointerId);
    }
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onGestureEnd);
    target.removeEventListener('pointercancel', onGestureEnd);
    onEnd?.();
  };

  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onGestureEnd);
  target.addEventListener('pointercancel', onGestureEnd);
}
