import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePreprocessingStore } from '@/stores/preprocessing';

import PprocResizeSection from './PprocResizeSection.vue';

describe('PprocResizeSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders resize section labels', () => {
    const wrapper = mount(PprocResizeSection);
    expect(wrapper.text()).toContain('Max width');
    expect(wrapper.text()).toContain('Max height');
    expect(wrapper.text()).toContain('Prevent upscaling');
  });

  it('disables fields when preprocessing is disabled', () => {
    const store = usePreprocessingStore();
    store.setEnabled(false);

    const wrapper = mount(PprocResizeSection);
    const cards = wrapper.findAll('.field-card--disabled');
    expect(cards.length).toBeGreaterThan(0);
  });
});
