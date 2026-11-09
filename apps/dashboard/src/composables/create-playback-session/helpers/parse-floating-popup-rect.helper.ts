import type { FloatingPopupRect } from '../create-playback-session.types';

/** Parse persisted popup geometry, rejecting unsafe or unusable rectangles. */
export function parseFloatingPopupRect(
  raw: string | null,
): FloatingPopupRect | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    const candidate = parsed as Record<string, unknown>;
    const values = [
      candidate.x,
      candidate.y,
      candidate.width,
      candidate.height,
    ];
    if (
      !values.every(
        (value) =>
          typeof value === 'number' &&
          Number.isFinite(value) &&
          Math.abs(value) <= Number.MAX_SAFE_INTEGER,
      )
    ) {
      return null;
    }
    const rect: FloatingPopupRect = {
      x: Number(candidate.x),
      y: Number(candidate.y),
      width: Number(candidate.width),
      height: Number(candidate.height),
    };
    return rect.width > 0 && rect.height > 0 ? rect : null;
  } catch {
    return null;
  }
}
