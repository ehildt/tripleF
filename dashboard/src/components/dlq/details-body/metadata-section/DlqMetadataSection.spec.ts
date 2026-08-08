import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqMetadataSection from './DlqMetadataSection.vue';

const baseEntry: DlqEntry = {
  requestId: 'req-1',
  queueName: 'harness',
  jobId: 'job-5',
  status: 'Failed',
  payload: { meta: [{ name: 'image-a' }] },
  failedReason: null,
  failedAt: '2024-01-15T12:00:00Z',
  attemptsMade: 1,
  totalAttempts: 3,
  nextRetryAt: null,
  createdAt: '2024-01-14T08:00:00Z',
};

describe('DlqMetadataSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the metadata title', () => {
    const wrapper = mount(DlqMetadataSection, { props: { entry: baseEntry } });
    expect(wrapper.text()).toContain('Metadata');
  });

  it('renders the job ID and status', () => {
    const wrapper = mount(DlqMetadataSection, { props: { entry: baseEntry } });
    expect(wrapper.text()).toContain('job-5');
    expect(wrapper.text()).toContain('Failed');
  });

  it('renders the next retry field when set', () => {
    const entry = { ...baseEntry, nextRetryAt: '2024-01-16T00:00:00Z' };
    const wrapper = mount(DlqMetadataSection, { props: { entry } });
    expect(wrapper.text()).toContain('Retry at');
  });
});
