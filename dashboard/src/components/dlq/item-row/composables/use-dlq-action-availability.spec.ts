import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type { DlqStatus } from '../../../../types/dlq-status.model';
import { useDlqActionAvailability } from './use-dlq-action-availability';

type DlqStatusValue = DlqStatus;

describe('useDlqActionAvailability', () => {
  it('marks Failed entries as retryable, archivable, and deletable', () => {
    const status = ref<DlqStatusValue>('Failed');
    const { isRetryable, isArchivable, isDeletable, isSelectable } =
      useDlqActionAvailability(status);
    expect(isRetryable.value).toBe(true);
    expect(isArchivable.value).toBe(true);
    expect(isDeletable.value).toBe(true);
    expect(isSelectable.value).toBe(true);
  });

  it('marks Cleared entries as retryable but not archivable', () => {
    const status = ref<DlqStatusValue>('Cleared');
    const { isRetryable, isArchivable, isDeletable, isSelectable } =
      useDlqActionAvailability(status);
    expect(isRetryable.value).toBe(true);
    expect(isArchivable.value).toBe(false);
    expect(isDeletable.value).toBe(true);
    expect(isSelectable.value).toBe(true);
  });

  it('marks Active entries as archivable but not retryable', () => {
    const status = ref<DlqStatusValue>('Active');
    const { isRetryable, isArchivable, isDeletable, isSelectable } =
      useDlqActionAvailability(status);
    expect(isRetryable.value).toBe(false);
    expect(isArchivable.value).toBe(true);
    expect(isDeletable.value).toBe(true);
    expect(isSelectable.value).toBe(true);
  });

  it('marks Removed entries as not deletable and not selectable', () => {
    const status = ref<DlqStatusValue>('Removed');
    const { isRetryable, isArchivable, isDeletable, isSelectable } =
      useDlqActionAvailability(status);
    expect(isRetryable.value).toBe(false);
    expect(isArchivable.value).toBe(false);
    expect(isDeletable.value).toBe(false);
    expect(isSelectable.value).toBe(false);
  });
});
