import type { ShownMediaKind } from '../../../generated/prisma/client.js';

export interface ShownMediaEntry {
  kind: ShownMediaKind;
  mediaKey: string;
}
