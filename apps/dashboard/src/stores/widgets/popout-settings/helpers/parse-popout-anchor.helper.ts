import {
  DEFAULT_POPOUT_ANCHOR,
  POPOUT_ANCHORS,
} from '../popout-settings.constant';
import type { PopoutAnchor } from '../popout-settings.types';

/** Parse a persisted popout anchor without casts or external-state reads. */
export function parsePopoutAnchor(saved: string | null): PopoutAnchor {
  return (
    POPOUT_ANCHORS.find((anchor) => anchor === saved) ?? DEFAULT_POPOUT_ANCHOR
  );
}
