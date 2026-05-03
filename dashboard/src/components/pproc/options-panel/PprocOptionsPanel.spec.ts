import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import PprocOptionsPanel from './PprocOptionsPanel.vue';

describe('PprocOptionsPanel', () => {
  it('renders all parameter labels', () => {
    setActivePinia(createPinia());
    const wrapper = mount(PprocOptionsPanel);
    expect(wrapper.text()).toContain('Blur Sigma');
    expect(wrapper.text()).toContain('Sharpen Sigma');
    expect(wrapper.text()).toContain('CLAHE Width');
    expect(wrapper.text()).toContain('Norm. Lower');
    expect(wrapper.text()).toContain('Norm. Upper');
  });

  it('renders a reset-all button', () => {
    setActivePinia(createPinia());
    const wrapper = mount(PprocOptionsPanel);
    expect(wrapper.find('button[title="Reset all"]').exists()).toBe(true);
  });
});
