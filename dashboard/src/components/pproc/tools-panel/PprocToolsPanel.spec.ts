import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import PprocToolsPanel from './PprocToolsPanel.vue';

describe('PprocToolsPanel', () => {
  it('renders the master power toggle and section headers', () => {
    setActivePinia(createPinia());
    const wrapper = mount(PprocToolsPanel);
    expect(
      wrapper.find('button[aria-label="Enable preprocessing"]').exists(),
    ).toBe(true);
    expect(wrapper.text()).toContain('Resize Settings');
    expect(wrapper.text()).toContain('Image Variants');
    expect(wrapper.text()).toContain('Advanced Parameters');
  });

  it('lists all five image variants', () => {
    setActivePinia(createPinia());
    const wrapper = mount(PprocToolsPanel);
    expect(wrapper.text()).toContain('Original');
    expect(wrapper.text()).toContain('Grayscale');
    expect(wrapper.text()).toContain('Denoise');
    expect(wrapper.text()).toContain('Sharpen');
    expect(wrapper.text()).toContain('CLAHE');
  });
});
