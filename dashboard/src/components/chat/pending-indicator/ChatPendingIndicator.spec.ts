import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ChatPendingIndicator from './ChatPendingIndicator.vue';

describe('ChatPendingIndicator', () => {
  it('renders the indicator', () => {
    const wrapper = mount(ChatPendingIndicator);
    expect(wrapper.find('span.w-8').exists()).toBe(true);
    expect(wrapper.find('span.animate-battery-slide').exists()).toBe(true);
  });

  it('renders default variant with bg-loading', () => {
    const wrapper = mount(ChatPendingIndicator);
    expect(
      wrapper.find('span.animate-battery-slide').classes().join(' '),
    ).toContain('bg-loading');
  });

  it('renders aborting variant with bg-loading-secondary', () => {
    const wrapper = mount(ChatPendingIndicator, {
      props: { variant: 'aborting' },
    });
    expect(
      wrapper.find('span.animate-battery-slide').classes().join(' '),
    ).toContain('bg-loading-secondary');
  });
});
