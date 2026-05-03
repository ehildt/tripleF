import { RefreshCw } from '@lucide/vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DlqReloadButton from './DlqReloadButton.vue';

describe('DlqReloadButton', () => {
  it('renders the refresh icon when not loading', () => {
    const wrapper = mount(DlqReloadButton, {
      props: { loading: false },
    });
    expect(wrapper.findComponent(RefreshCw).exists()).toBe(true);
  });

  it('shows the loading indicator when loading', () => {
    const wrapper = mount(DlqReloadButton, {
      props: { loading: true },
    });
    expect(wrapper.findComponent(RefreshCw).exists()).toBe(false);
  });

  it('emits click when the refresh button is clicked', () => {
    const wrapper = mount(DlqReloadButton, {
      props: { loading: false },
    });
    wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
