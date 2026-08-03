import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MotionIcon from './MotionIcon.vue';

describe('MotionIcon', () => {
  it('renders its icon slot inside the motion wrapper', () => {
    const wrapper = mount(MotionIcon, {
      slots: { default: '<BellRing class="custom-icon" />' },
    });
    const html = wrapper.html();
    expect(html).toContain('motion-icon');
    expect(html).toContain('custom-icon');
  });
});
