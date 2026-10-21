import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type { DlqStatus } from '../../../../types/dlq-status.model';
import { useDlqActionAvailability } from './use-dlq-action-availability';

type DlqStatusValue = DlqStatus;

const RETRYABLE_CASES: Array<{
  status: DlqStatusValue;
  retryable: boolean;
  archivable: boolean;
  deletable: boolean;
  selectable: boolean;
}> = [
  {
    status: 'Failed',
    retryable: true,
    archivable: true,
    deletable: true,
    selectable: true,
  },
  {
    status: 'Cleared',
    retryable: true,
    archivable: false,
    deletable: true,
    selectable: true,
  },
  {
    status: 'Active',
    retryable: false,
    archivable: true,
    deletable: true,
    selectable: true,
  },
  {
    status: 'Removed',
    retryable: false,
    archivable: false,
    deletable: false,
    selectable: false,
  },
];

describe('useDlqActionAvailability', () => {
  it.each(RETRYABLE_CASES)(
    'marks $status entries with retryable=$retryable, archivable=$archivable, deletable=$deletable, selectable=$selectable',
    ({ status, retryable, archivable, deletable, selectable }) => {
      const statusRef = ref<DlqStatusValue>(status);
      const { isRetryable, isArchivable, isDeletable, isSelectable } =
        useDlqActionAvailability(statusRef);
      expect(isRetryable.value).toBe(retryable);
      expect(isArchivable.value).toBe(archivable);
      expect(isDeletable.value).toBe(deletable);
      expect(isSelectable.value).toBe(selectable);
    },
  );
});
