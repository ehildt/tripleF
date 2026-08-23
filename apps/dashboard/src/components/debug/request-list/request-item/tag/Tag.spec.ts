import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Tag from './Tag.vue';

describe('Tag', () => {
  it('renders value text', () => {
    const wrapper = mount(Tag, {
      props: { variant: 'type', value: 'socket' },
    });
    expect(wrapper.text()).toContain('socket');
  });

  it.each([
    ['type', 'socket'],
    ['direction', 'response'],
    ['status', 'success'],
  ] as const)('renders %s variant with value %s', (variant, value) => {
    const wrapper = mount(Tag, {
      props: { variant, value },
    });
    expect(wrapper.text()).toContain(value);
  });
});
