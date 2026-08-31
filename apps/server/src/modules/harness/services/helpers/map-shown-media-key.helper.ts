import type { ShownMediaKind } from '../../../../generated/prisma/client.js';

/** Wrap a media key with its shown-media kind. */
export function mapShownMediaKey(mediaKey: string, kind: ShownMediaKind) {
  return { kind, mediaKey };
}
