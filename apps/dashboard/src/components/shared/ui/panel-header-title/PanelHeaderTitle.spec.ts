import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PanelHeaderTitle from './PanelHeaderTitle.vue';

describe('PanelHeaderTitle', () => {
  it('renders label', () => {
    const wrapper = mount(PanelHeaderTitle, {
      props: { label: 'Results' },
    });
    expect(wrapper.text()).toContain('Results');
  });
});
