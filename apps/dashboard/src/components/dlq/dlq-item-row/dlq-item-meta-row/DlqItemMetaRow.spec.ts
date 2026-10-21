import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DlqItemMetaRow from './DlqItemMetaRow.vue';

describe('DlqItemMetaRow', () => {
  it('renders queue name and attempts', () => {
    const wrapper = mount(DlqItemMetaRow, {
      props: {
        queueName: 'harness',
        attemptsMade: 1,
        totalAttempts: 3,
        failedAt: '2024-01-01T00:00:00Z',
      },
    });
    expect(wrapper.text()).toContain('harness');
    expect(wrapper.text()).toContain('1/3 attempt');
  });

  it('pluralizes the attempt label correctly', () => {
    const wrapper = mount(DlqItemMetaRow, {
      props: {
        queueName: 'harness',
        attemptsMade: 2,
        totalAttempts: 3,
        failedAt: '2024-01-01T00:00:00Z',
      },
    });
    expect(wrapper.text()).toContain('2/3 attempts');
  });

  it('renders a dash for null failedAt', () => {
    const wrapper = mount(DlqItemMetaRow, {
      props: {
        queueName: 'harness',
        attemptsMade: 0,
        totalAttempts: 3,
        failedAt: null,
      },
    });
    expect(wrapper.text()).toContain('—');
  });
});
