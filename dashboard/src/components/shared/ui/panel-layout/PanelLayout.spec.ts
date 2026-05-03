import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PanelLayout from './PanelLayout.vue';

describe('PanelLayout', () => {
  it('renders slot content inside elevated shell', () => {
    const wrapper = mount(PanelLayout, {
      slots: { default: '<span data-testid="slot">Content</span>' },
    });
    expect(wrapper.find('[data-testid="slot"]').exists()).toBe(true);
    expect(wrapper.find('div').classes().join(' ')).toContain('bg-elevated');
    expect(wrapper.find('div').classes().join(' ')).toContain('panel-glow');
  });
});
