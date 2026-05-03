import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  type PreprocessingSettings,
} from '../../../../stores/preprocessing';
import DlqPreprocessingParams from './DlqPreprocessingParams.vue';

const baseSettings: PreprocessingSettings = {
  ...DEFAULT_PREPROCESSING_SETTINGS,
  enabled: true,
};

describe('DlqPreprocessingParams', () => {
  it('renders all ten parameter tiles', () => {
    const wrapper = mount(DlqPreprocessingParams, {
      props: { settings: baseSettings },
    });
    expect(wrapper.text()).toContain('Blur Sigma');
    expect(wrapper.text()).toContain('Sharpen Sigma');
    expect(wrapper.text()).toContain('CLAHE Width');
    expect(wrapper.text()).toContain('Brightness');
    expect(wrapper.text()).toContain('Norm. Lower');
    expect(wrapper.text()).toContain('Norm. Upper');
  });
});
