import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CapabilityBadge from './CapabilityBadge.vue';

describe('CapabilityBadge', () => {
  it('renders the capability icon with the label as tooltip', () => {
    const wrapper = mount(CapabilityBadge, { props: { capability: 'vision' } });
    const badge = wrapper.find('.capability-badge--icon');
    expect(badge.exists()).toBe(true);
    expect(badge.attributes('title')).toBe('vision');
    expect(badge.attributes('aria-label')).toBe('vision');
    expect(badge.text()).toBe('');
  });

  it('renders known icons for every mapped capability', () => {
    for (const capability of [
      'vision',
      'audio',
      'tools',
      'thinking',
      'completion',
    ]) {
      const wrapper = mount(CapabilityBadge, { props: { capability } });
      expect(wrapper.find('.capability-badge--icon').exists()).toBe(true);
      expect(wrapper.find('.capability-badge--icon').attributes('title')).toBe(
        capability,
      );
    }
  });

  it('falls back to the text badge for unknown capabilities', () => {
    const wrapper = mount(CapabilityBadge, { props: { capability: 'insert' } });
    expect(wrapper.find('.capability-badge--icon').exists()).toBe(false);
    expect(wrapper.find('.capability-badge').text()).toBe('insert');
  });
});
