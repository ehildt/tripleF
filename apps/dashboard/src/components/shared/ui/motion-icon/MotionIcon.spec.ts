import { BellRing } from '@lucide/vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import MotionIcon from './MotionIcon.vue';

describe('MotionIcon', () => {
  it('renders its icon slot inside the motion wrapper', () => {
    const wrapper = mount(MotionIcon, {
      slots: { default: () => h(BellRing, { class: 'custom-icon' }) },
    });
    const html = wrapper.html();
    expect(html).toContain('motion-icon');
    expect(html).toContain('custom-icon');
  });
});
