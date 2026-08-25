/**
 * After an interaction (drag/zoom/grab), auto-rotation stays paused this long
 * before resuming. Rotation is on by default — this is the resume cooldown.
 */
const ROTATION_RESUME_DELAY_MS = 1500;
/** Rotation speed while idle (rad/s — ~0.1 ≈ one revolution per minute). */
const IDLE_ROTATION_SPEED = 0.1;

/**
 * Auto-rotate: the yaw increment for this frame — 0 while the user is
 * dragging/panning/grabbing, hovering a dot (so the tooltip stays readable),
 * or inside the resume cooldown after the last interaction; otherwise a slow
 * orbit (on by default).
 */
export function idleYawIncrement(
  isInteracting: boolean,
  isHovering: boolean,
  lastInteraction: number,
  deltaSeconds: number,
  nowMs: number,
): number {
  if (isInteracting) return 0;
  if (isHovering) return 0;
  if (nowMs - lastInteraction <= ROTATION_RESUME_DELAY_MS) return 0;
  return IDLE_ROTATION_SPEED * deltaSeconds;
}
