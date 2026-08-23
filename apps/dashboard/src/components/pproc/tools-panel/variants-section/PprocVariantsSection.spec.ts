import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePreprocessingStore } from '@/stores/preprocessing';

import PprocVariantsSection from './PprocVariantsSection.vue';

describe('PprocVariantsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
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
    const originalCard = wrapper.findAll('.field-card')[0];
    expect(originalCard.exists()).toBe(true);

    await originalCard.find('.field-card__checkbox').trigger('click');
    expect(store.variants.original).toBe(true);
  });
});
