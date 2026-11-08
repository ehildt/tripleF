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
    expect(wrapper.find('button').attributes('aria-busy')).toBe('false');
  });

  it('animates and disables the refresh icon while loading', () => {
    const wrapper = mount(DlqReloadButton, {
      props: { loading: true },
    });

    expect(wrapper.findComponent(RefreshCw).exists()).toBe(true);
    expect(wrapper.findComponent(RefreshCw).classes()).toContain(
      'dlq-reload-button__icon--loading',
    );
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true');
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('emits click when the refresh button is clicked', async () => {
    const wrapper = mount(DlqReloadButton, {
      props: { loading: false },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
