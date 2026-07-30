import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ContextUsageIndicator from './ContextUsageIndicator.vue';

describe('ContextUsageIndicator', () => {
  it('renders percent when provided', () => {
    const wrapper = mount(ContextUsageIndicator, { props: { percent: 42 } });
    expect(wrapper.text()).toContain('42%');
  });

  it('renders nothing when percent is null', () => {
    const wrapper = mount(ContextUsageIndicator, { props: { percent: null } });
    expect(wrapper.find('.context-usage-indicator').exists()).toBe(false);
  });

  it('applies error color above 80%', () => {
    const wrapper = mount(ContextUsageIndicator, { props: { percent: 92 } });
    expect(
      wrapper.find('.context-usage-indicator__value--error').exists(),
    ).toBe(true);
  });

  it('applies warning color between 50% and 80%', () => {
    const wrapper = mount(ContextUsageIndicator, { props: { percent: 65 } });
    expect(
      wrapper.find('.context-usage-indicator__value--warning').exists(),
    ).toBe(true);
  });

  it('applies info color below 50%', () => {
    const wrapper = mount(ContextUsageIndicator, { props: { percent: 42 } });
    expect(wrapper.find('.context-usage-indicator__value--info').exists()).toBe(
      true,
    );
  });
});
