import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DlqPendingIndicator from './DlqPendingIndicator.vue';

describe('DlqPendingIndicator', () => {
  it('renders the indicator track and bar', () => {
    const wrapper = mount(DlqPendingIndicator);
    expect(wrapper.find('.dlq-pending-indicator').exists()).toBe(true);
    expect(wrapper.find('.dlq-pending-indicator__bar').exists()).toBe(true);
  });

  it('renders the default variant without the aborting modifier', () => {
    const wrapper = mount(DlqPendingIndicator);
    expect(wrapper.find('.dlq-pending-indicator__bar--aborting').exists()).toBe(
      false,
    );
  });

  it('applies the aborting modifier for the aborting variant', () => {
    const wrapper = mount(DlqPendingIndicator, {
      props: { variant: 'aborting' },
    });
    expect(wrapper.find('.dlq-pending-indicator__bar--aborting').exists()).toBe(
      true,
    );
  });
});
