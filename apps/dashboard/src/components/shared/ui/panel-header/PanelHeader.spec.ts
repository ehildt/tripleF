import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PanelHeader from './PanelHeader.vue';

describe('PanelHeader', () => {
  it('renders slot content in a header row', () => {
    const wrapper = mount(PanelHeader, {
      slots: { default: '<span data-testid="lead">Title</span>' },
    });
    expect(wrapper.find('[data-testid="lead"]').exists()).toBe(true);
    expect(wrapper.find('div').classes()).toContain('panel-header');
  });
});
