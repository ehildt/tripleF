import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePreprocessingSettingsStore } from '@/stores/preprocessing-settings/preprocessing-settings.store';

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
    const store = usePreprocessingSettingsStore();
    store.setEnabled(false);

    const wrapper = mount(PprocResizeSection);
    const cards = wrapper.findAll(
      '.select-field-card--disabled, .number-field-card--disabled',
    );
    expect(cards.length).toBeGreaterThan(0);
  });
});
