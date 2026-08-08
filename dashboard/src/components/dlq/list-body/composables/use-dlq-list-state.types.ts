import type { Ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

export interface UseDlqListStateOptions {
  entries: Ref<DlqEntry[]>;
  hideRead: Ref<boolean>;
  isEntryRead: (entry: DlqEntry) => boolean;
  entryReadKey: (entry: DlqEntry) => string;
}
