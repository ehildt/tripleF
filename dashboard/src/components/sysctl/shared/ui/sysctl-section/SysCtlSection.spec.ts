import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SysCtlSection from './SysCtlSection.vue';

describe('SysCtlSection', () => {
  it('renders the default slot by default', () => {
    const wrapper = mount(SysCtlSection, {
      slots: { default: '<div data-test="panel">Content</div>' },
    });
    expect(wrapper.find('[data-test="panel"]').exists()).toBe(true);
  });

  it('shows the loading state instead of content while loading', () => {
    const wrapper = mount(SysCtlSection, {
      props: { loading: true, loadingMessage: 'Loading…' },
      slots: { default: '<div data-test="panel">Content</div>' },
    });
    expect(wrapper.text()).toContain('Loading…');
    expect(wrapper.find('[data-test="panel"]').exists()).toBe(false);
  });

  it('shows the error state instead of content on error', () => {
    const wrapper = mount(SysCtlSection, {
      props: { error: true, errorMessage: 'Failed to load config.' },
      slots: { default: '<div data-test="panel">Content</div>' },
    });
    expect(wrapper.text()).toContain('Failed to load config.');
    expect(wrapper.find('[data-test="panel"]').exists()).toBe(false);
  });
});
