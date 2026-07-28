import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqListBody from './DlqListBody.vue';

const makeEntry = (id: string): DlqEntry =>
  ({
    requestId: id,
    queueName: 'harness',
    jobId: null,
    status: 'Failed',
    payload: null,
    failedReason: null,
    failedAt: '2024-01-01T00:00:00Z',
    attemptsMade: 1,
    totalAttempts: 3,
    nextRetryAt: null,
    createdAt: '',
  }) as DlqEntry;

describe('DlqListBody', () => {
  it('shows the empty state when there are no entries', () => {
    const wrapper = mount(DlqListBody, {
      props: {
        entries: [],
        selectedEntryId: null,
        error: null,
        isEntryRead: () => false,
        entryReadKey: (entry: DlqEntry) => entry.requestId,
      },
    });
    expect(wrapper.text()).toContain('No failed jobs');
  });

  it('shows the error state when an error is provided', () => {
    const wrapper = mount(DlqListBody, {
      props: {
        entries: [],
        selectedEntryId: null,
        error: 'Network error',
        isEntryRead: () => false,
        entryReadKey: (entry: DlqEntry) => entry.requestId,
      },
    });
    expect(wrapper.text()).toContain('Network error');
  });

  it('renders the entries', () => {
    const wrapper = mount(DlqListBody, {
      props: {
        entries: [makeEntry('a'), makeEntry('b')],
        selectedEntryId: null,
        error: null,
        isEntryRead: () => false,
        entryReadKey: (entry: DlqEntry) => entry.requestId,
      },
    });
    expect(wrapper.text()).toContain('a');
    expect(wrapper.text()).toContain('b');
  });

  it('emits select when a row is clicked', () => {
    const wrapper = mount(DlqListBody, {
      props: {
        entries: [makeEntry('a')],
        selectedEntryId: null,
        error: null,
        isEntryRead: () => false,
        entryReadKey: (entry: DlqEntry) => entry.requestId,
      },
    });
    wrapper.find('.dlq-list-body__row').trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
  });
});
