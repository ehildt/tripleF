import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import PprocToolsPanel from './PprocToolsPanel.vue';

describe('PprocToolsPanel', () => {
  it('renders the master power toggle', () => {
    setActivePinia(createPinia());
    const wrapper = mount(PprocToolsPanel);
    expect(
      wrapper.find('button[aria-label="Enable preprocessing"]').exists(),
    ).toBe(true);
  });

  it('renders the resize fields', () => {
    setActivePinia(createPinia());
    const wrapper = mount(PprocToolsPanel);
    expect(wrapper.text()).toContain('Max width');
    expect(wrapper.text()).toContain('Max height');
    expect(wrapper.text()).toContain('Prevent upscaling');
  });

  it('renders the image variant fields', () => {
    setActivePinia(createPinia());
    const wrapper = mount(PprocToolsPanel);
    expect(wrapper.text()).toContain('Original');
    expect(wrapper.text()).toContain('Grayscale');
    expect(wrapper.text()).toContain('Denoise');
    expect(wrapper.text()).toContain('Sharpen');
    expect(wrapper.text()).toContain('CLAHE');
  });

  it('renders the advanced parameter fields', () => {
    setActivePinia(createPinia());
    const wrapper = mount(PprocToolsPanel);
    expect(wrapper.text()).toContain('Blur Sigma');
    expect(wrapper.text()).toContain('Sharpen Sigma');
    expect(wrapper.text()).toContain('CLAHE Width');
    expect(wrapper.text()).toContain('Brightness');
  });
});
