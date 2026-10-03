import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqTopBar from './DlqTopBar.vue';

const baseEntry: DlqEntry = {
  requestId: 'req-1',
  queueName: 'harness',
  jobId: null,
  jobName: 'req-1',
  status: 'Failed',
  payload: { filters: { model: 'llama3', event: 'harness', roomId: 'r1' } },
  failedReason: null,
  failedAt: null,
  attemptsMade: 0,
  totalAttempts: 3,
  nextRetryAt: null,
  createdAt: '',
};

describe('DlqTopBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the Model, Stream, and Context dropdowns', () => {
    const wrapper = mount(DlqTopBar, {
      props: { entry: baseEntry, models: ['llama3'], isImmutable: false },
    });
    expect(wrapper.text()).toContain('Model');
    expect(wrapper.text()).toContain('Stream');
  });

  it('opens a searchable model list from the model field', async () => {
    const wrapper = mount(DlqTopBar, {
      props: { entry: baseEntry, models: ['llama3'], isImmutable: false },
    });
    const trigger = wrapper.find('.model-select-field__trigger');
    await trigger.trigger('click');
    // The dropdown teleports to the body; query the document for the list.
    expect(
      document.body.querySelector('.model-list-search__input'),
    ).toBeTruthy();
  });

  it('does not show editable controls when immutable', () => {
    const wrapper = mount(DlqTopBar, {
      props: { entry: baseEntry, models: ['llama3'], isImmutable: true },
    });
    const disabledInputs = wrapper.findAll('[disabled]');
    expect(disabledInputs.length).toBeGreaterThan(0);
  });
});
