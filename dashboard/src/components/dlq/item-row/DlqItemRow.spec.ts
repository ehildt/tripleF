import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqItemRow from './DlqItemRow.vue';

const makeEntry = (overrides: Partial<DlqEntry> = {}): DlqEntry =>
  ({
    requestId: 'req-1',
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
    ...overrides,
  }) as DlqEntry;

describe('DlqItemRow', () => {
  it('renders the request ID', () => {
    const wrapper = mount(DlqItemRow, {
      props: { entry: makeEntry() },
    });
    expect(wrapper.text()).toContain('req-1');
  });

  it('renders status badge text', () => {
    const wrapper = mount(DlqItemRow, {
      props: { entry: makeEntry() },
    });
    expect(wrapper.text()).toContain('Failed');
  });

  it('hides the retry button for non-retryable entries', () => {
    const wrapper = mount(DlqItemRow, {
      props: {
        entry: makeEntry({ status: 'Removed' }),
      },
    });
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(0);
  });

  it('emits retry when the retry button is clicked', () => {
    const wrapper = mount(DlqItemRow, {
      props: { entry: makeEntry() },
    });
    const buttons = wrapper.findAll('button');
    const retryBtn = buttons[0];
    retryBtn.trigger('click');
    expect(wrapper.emitted('retry')?.[0]).toEqual(['req-1']);
  });

  it('emits archive when the archive button is clicked', () => {
    const wrapper = mount(DlqItemRow, {
      props: { entry: makeEntry() },
    });
    const buttons = wrapper.findAll('button');
    buttons[1].trigger('click');
    expect(wrapper.emitted('archive')?.[0]).toEqual(['req-1']);
  });

  it('emits delete only after a confirming second click', async () => {
    const wrapper = mount(DlqItemRow, {
      props: { entry: makeEntry() },
    });
    const buttons = wrapper.findAll('button');
    await buttons[2].trigger('click');
    expect(wrapper.emitted('delete')).toBeUndefined();
    await buttons[2].trigger('click');
    expect(wrapper.emitted('delete')?.[0]).toEqual(['req-1']);
  });
});
