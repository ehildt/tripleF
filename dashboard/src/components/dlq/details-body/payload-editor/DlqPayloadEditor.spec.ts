import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqPayloadEditor from './DlqPayloadEditor.vue';

const entry: DlqEntry = {
  requestId: 'req-1',
  queueName: 'harness',
  jobId: null,
  status: 'Failed',
  payload: { filters: { model: 'llama3' } },
  failedReason: null,
  failedAt: null,
  attemptsMade: 1,
  totalAttempts: 3,
  nextRetryAt: null,
  createdAt: '',
};

describe('DlqPayloadEditor', () => {
  it('renders nothing when the entry has no payload', () => {
    const wrapper = mount(DlqPayloadEditor, {
      props: { entry: { ...entry, payload: null }, isImmutable: false },
    });
    expect(wrapper.find('pre').exists()).toBe(false);
  });

  it('renders the formatted payload', () => {
    const wrapper = mount(DlqPayloadEditor, {
      props: { entry, isImmutable: false },
    });
    expect(wrapper.text()).toContain('llama3');
  });

  it('does not show the edit button when immutable', () => {
    const wrapper = mount(DlqPayloadEditor, {
      props: { entry, isImmutable: true },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('clicking the pre starts editing and shows a textarea', async () => {
    const wrapper = mount(DlqPayloadEditor, {
      props: { entry, isImmutable: false },
    });
    await wrapper.find('pre').trigger('click');
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('emits save-payload when the user edits and saves', async () => {
    const wrapper = mount(DlqPayloadEditor, {
      props: { entry, isImmutable: false },
    });
    await wrapper.find('pre').trigger('click');
    // Click the success (Check) button to save
    const checkBtn = wrapper
      .findAll('button')
      .find((b) =>
        b.classes().includes('dlq-payload-editor__toolbar-button--success'),
      );
    expect(checkBtn).toBeDefined();
    await checkBtn?.trigger('click');
    expect(wrapper.emitted('savePayload')).toBeTruthy();
  });
});
