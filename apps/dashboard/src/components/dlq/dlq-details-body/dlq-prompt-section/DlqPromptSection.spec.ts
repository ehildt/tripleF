import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqPromptSection from './DlqPromptSection.vue';

const baseEntry: DlqEntry = {
  requestId: 'req-1',
  queueName: 'harness',
  jobId: null,
  status: 'Failed',
  payload: {
    filters: {
      prompt: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
    },
  },
  failedReason: null,
  failedAt: null,
  attemptsMade: 0,
  totalAttempts: 3,
  nextRetryAt: null,
  createdAt: '',
};

describe('DlqPromptSection', () => {
  it('renders the Prompt heading', () => {
    const wrapper = mount(DlqPromptSection, { props: { entry: baseEntry } });
    expect(wrapper.text()).toContain('Prompt');
  });

  it('renders messages from a prompt array', () => {
    const wrapper = mount(DlqPromptSection, { props: { entry: baseEntry } });
    expect(wrapper.text()).toContain('Hello');
  });

  it('handles entries without a prompt', () => {
    const entry = { ...baseEntry, payload: {} };
    const wrapper = mount(DlqPromptSection, { props: { entry } });
    // The ExpandableMessageList hides itself when the items are empty
    expect(wrapper.text()).not.toContain('Hello');
  });
});
