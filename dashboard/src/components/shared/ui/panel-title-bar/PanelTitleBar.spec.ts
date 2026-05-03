import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PanelTitleBar from './PanelTitleBar.vue';

describe('PanelTitleBar', () => {
  it('renders title', () => {
    const wrapper = mount(PanelTitleBar, { props: { title: 'Requests' } });
    expect(wrapper.text()).toContain('Requests');
  });

  it('shows count when provided', () => {
    const wrapper = mount(PanelTitleBar, {
      props: { title: 'Logs', count: 3 },
    });
    expect(wrapper.text()).toContain('[3]');
  });

  it('does not show count when zero', () => {
    const wrapper = mount(PanelTitleBar, {
      props: { title: 'Logs', count: 0 },
    });
    expect(wrapper.text()).not.toContain('[0]');
  });

  it('renders default icon slot', () => {
    const wrapper = mount(PanelTitleBar, { props: { title: 'Logs' } });
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('renders custom icon slot', () => {
    const wrapper = mount(PanelTitleBar, {
      props: { title: 'Logs' },
      slots: { icon: '<span data-testid="custom-icon">!</span>' },
    });
    expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true);
  });

  it('renders actions slot', () => {
    const wrapper = mount(PanelTitleBar, {
      props: { title: 'Logs' },
      slots: { actions: '<button>Clear</button>' },
    });
    expect(wrapper.find('button').exists()).toBe(true);
  });
});
