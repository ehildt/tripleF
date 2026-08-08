import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import PprocAdvancedParametersSection from './PprocAdvancedParametersSection.vue';

describe('PprocAdvancedParametersSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders all parameter labels', () => {
    const wrapper = mount(PprocAdvancedParametersSection);
    expect(wrapper.text()).toContain('Blur Sigma');
    expect(wrapper.text()).toContain('Sharpen Sigma');
    expect(wrapper.text()).toContain('CLAHE Width');
    expect(wrapper.text()).toContain('Brightness');
  });
});
