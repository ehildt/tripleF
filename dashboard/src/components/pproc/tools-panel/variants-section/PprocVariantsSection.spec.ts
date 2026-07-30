import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePreprocessingStore } from '@/stores/preprocessing';

import PprocVariantsSection from './PprocVariantsSection.vue';

describe('PprocVariantsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the section title', () => {
    const wrapper = mount(PprocVariantsSection);
    expect(wrapper.text()).toContain('Image Variants');
  });

  it('lists all five image variants', () => {
    const wrapper = mount(PprocVariantsSection);
    expect(wrapper.text()).toContain('Original');
    expect(wrapper.text()).toContain('Grayscale');
    expect(wrapper.text()).toContain('Denoise');
    expect(wrapper.text()).toContain('Sharpen');
    expect(wrapper.text()).toContain('CLAHE');
  });

  it('toggles a variant on click when enabled', async () => {
    const store = usePreprocessingStore();
    store.setEnabled(true);
    store.setVariant('original', false);

    const wrapper = mount(PprocVariantsSection);
    const originalButton = wrapper.findAll('.pproc-toggle-button')[0];
    expect(originalButton.exists()).toBe(true);

    await originalButton.trigger('click');
    expect(store.variants.original).toBe(true);
  });
});
