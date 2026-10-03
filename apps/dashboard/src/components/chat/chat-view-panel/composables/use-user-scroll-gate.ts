export interface UserScrollGate {
  /**
   * Arms the user-scroll gesture on its first event and returns true exactly
   * then; returns false for every trailing event until the gesture ends.
   */
  armUserScrollGesture: () => boolean;
  /** End the current user-scroll gesture (the scroller's scrollend). */
  endUserScrollGesture: () => void;
}

/**
 * Collapses a burst of user-scroll events into one emission: the first event
 * of a gesture arms the gate (and should be emitted); every later event —
 * including the full momentum tail — reads the latch and stays silent. The
 * latch releases on `scrollend`, so the next deliberate scroll starts a new
 * gesture. No timestamps or quiet thresholds.
 */
export function useUserScrollGate(): UserScrollGate {
  let gestureActive = false;

  function armUserScrollGesture(): boolean {
    if (gestureActive) return false;
    gestureActive = true;
    return true;
  }

  function endUserScrollGesture() {
    gestureActive = false;
  }

  return { armUserScrollGesture, endUserScrollGesture };
}
