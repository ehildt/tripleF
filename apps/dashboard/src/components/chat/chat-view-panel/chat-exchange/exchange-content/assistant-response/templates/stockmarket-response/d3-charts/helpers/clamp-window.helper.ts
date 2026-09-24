import type { IndexWindow } from './compute-visible-window.helper';

/**
 * Clamp a visible index window into the series bounds while preserving its
 * span. Applied after every zoom/pan so the view never escapes the series.
 *
 * When `minFrom`/`maxTo` are given, the window is additionally confined to
 * that interval: the selected range (1D/1W/1M/3M…) is the territory the
 * user can see, so panning and zooming out can never escape into data
 * outside it.
 */
export function clampWindow(
  window: IndexWindow,
  dataLength: number,
  minFrom = 0,
  maxTo = dataLength,
): IndexWindow {
  if (dataLength <= 0) return { from: 0, to: 0 };
  const span = Math.min(
    Math.max(window.to - window.from, 1e-6),
    maxTo - minFrom,
  );
  const from = Math.min(Math.max(window.from, minFrom), maxTo - span);
  return { from, to: from + span };
}
