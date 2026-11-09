import {
  DEFAULT_TOAST_ANCHOR,
  TOAST_ANCHORS,
} from '../toast-settings.constant';
import type { ToastAnchor } from '../toast-settings.types';

/** Parse a persisted toast anchor without casts or storage access. */
export function parseToastAnchor(saved: string | null): ToastAnchor {
  return (
    TOAST_ANCHORS.find((anchor) => anchor === saved) ?? DEFAULT_TOAST_ANCHOR
  );
}
