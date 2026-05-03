import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  type PreprocessingSettings,
} from '../../../../stores/preprocessing';
import DlqPreprocessingSection from './DlqPreprocessingSection.vue';

const settings: PreprocessingSettings = { ...DEFAULT_PREPROCESSING_SETTINGS };

describe('DlqPreprocessingSection', () => {
  it('renders the master toggle and advanced parameters title', () => {
    const wrapper = mount(DlqPreprocessingSection, {
      props: { settings },
    });
    expect(wrapper.text()).toContain('Enable Preprocessing');
    expect(wrapper.text()).toContain('Advanced Parameters');
  });

  it('emits update:settings when the master toggle is clicked', () => {
    const wrapper = mount(DlqPreprocessingSection, {
      props: { settings },
    });
    wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update:settings')).toBeTruthy();
  });

  it('does not emit when disabled', () => {
    const wrapper = mount(DlqPreprocessingSection, {
      props: { settings, disabled: true },
    });
    wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update:settings')).toBeFalsy();
  });
});
