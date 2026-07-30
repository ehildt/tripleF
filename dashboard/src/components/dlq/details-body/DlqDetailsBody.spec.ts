import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqDetailsBody from './DlqDetailsBody.vue';

const baseEntry: DlqEntry = {
  requestId: 'req-1',
  queueName: 'harness',
  jobId: 'job-5',
  status: 'Failed',
  payload: { filters: { model: 'llama3' } },
  failedReason: null,
  failedAt: '2024-01-15T12:00:00Z',
  attemptsMade: 1,
  totalAttempts: 3,
  nextRetryAt: null,
  createdAt: '2024-01-14T08:00:00Z',
};

describe('DlqDetailsBody', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows the empty state when no entry is provided', () => {
    const wrapper = mount(DlqDetailsBody, {
      props: { entry: null, models: [] },
    });
    expect(wrapper.text()).toContain('Select a job');
  });

  it('renders the entry details when an entry is provided', () => {
    const wrapper = mount(DlqDetailsBody, {
      props: { entry: baseEntry, models: ['llama3'] },
    });
    expect(wrapper.text()).toContain('Details');
    expect(wrapper.text()).toContain('Metadata');
  });

  it('shows the Error tab when a failedReason is set', () => {
    const entry: DlqEntry = { ...baseEntry, failedReason: 'Bad input' };
    const wrapper = mount(DlqDetailsBody, {
      props: { entry, models: [] },
    });
    expect(wrapper.text()).toContain('Error');
  });

  it('switches to the Payload tab when clicked', async () => {
    const wrapper = mount(DlqDetailsBody, {
      props: { entry: baseEntry, models: [] },
    });
    const tabs = wrapper.findAll('.tab-panel__tab');
    const payloadTab = tabs[tabs.length - 1];
    await payloadTab.trigger('click');
    expect(payloadTab.classes()).toContain('tab-panel__tab--active');
  });

  it('emits save-payload when a filter is updated', async () => {
    const wrapper = mount(DlqDetailsBody, {
      props: { entry: baseEntry, models: [] },
    });
    const vm = wrapper.vm as unknown as {
      handleUpdateFilter: (k: string, v: unknown) => void;
    };
    vm.handleUpdateFilter('model', 'mistral');
    expect(wrapper.emitted('savePayload')).toBeTruthy();
  });
});
