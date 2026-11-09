import { DEFAULT_TOAST_DURATION_SECONDS } from '../toast-settings.constant';

/** Preserve the existing numeric-string semantics while accepting only finite positive durations. */
export function parseToastDurationSeconds(saved: string | null): number {
  const seconds = Number(saved);
  return Number.isFinite(seconds) && seconds > 0
    ? seconds
    : DEFAULT_TOAST_DURATION_SECONDS;
}
