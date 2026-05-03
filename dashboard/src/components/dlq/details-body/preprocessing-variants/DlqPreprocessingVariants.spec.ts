import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  type PreprocessingSettings,
} from '../../../../stores/preprocessing';
import DlqPreprocessingVariants from './DlqPreprocessingVariants.vue';

const baseSettings: PreprocessingSettings = {
  ...DEFAULT_PREPROCESSING_SETTINGS,
  enabled: true,
};

describe('DlqPreprocessingVariants', () => {
  it('renders all five variant toggles', () => {
    const wrapper = mount(DlqPreprocessingVariants, {
      props: { settings: baseSettings },
    });
    expect(wrapper.text()).toContain('Original');
    expect(wrapper.text()).toContain('Grayscale');
    expect(wrapper.text()).toContain('Denoise');
    expect(wrapper.text()).toContain('Sharpen');
    expect(wrapper.text()).toContain('CLAHE');
  });

  it('emits update:settings when a variant toggle is clicked', () => {
    const wrapper = mount(DlqPreprocessingVariants, {
      props: { settings: baseSettings },
    });
    wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update:settings')).toBeTruthy();
  });

  it('does not emit when settings are disabled', () => {
    const settings: PreprocessingSettings = {
      ...DEFAULT_PREPROCESSING_SETTINGS,
      enabled: false,
    };
    const wrapper = mount(DlqPreprocessingVariants, {
      props: { settings },
    });
    wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update:settings')).toBeFalsy();
  });
});
