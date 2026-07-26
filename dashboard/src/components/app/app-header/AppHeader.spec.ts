import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import AppHeader from './AppHeader.vue';

function mountHeader(props: Record<string, unknown> = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(AppHeader, {
    props: {
      activeTab: 'http',
      debugCount: 0,
      ...props,
    } as any,
    global: { plugins: [pinia] },
  });
}

describe('AppHeader', () => {
  it('renders all four tabs in the burger menu', async () => {
    const wrapper = mountHeader();
    await wrapper.find('.nav-menu__burger').trigger('click');
    expect(wrapper.text()).toContain('chat');
    expect(wrapper.text()).toContain('dlq');
    expect(wrapper.text()).toContain('debug');
    expect(wrapper.text()).toContain('sysctl');
  });

  it('emits tabChange when a menu tab is clicked', async () => {
    const wrapper = mountHeader();
    await wrapper.find('.nav-menu__burger').trigger('click');
    const dlqItem = wrapper
      .findAll('.nav-menu__item')
      .find((b) => b.text().includes('dlq'));
    expect(dlqItem).toBeDefined();
    await dlqItem!.trigger('click');
    expect(wrapper.emitted('tabChange')).toBeTruthy();
    expect(wrapper.emitted('tabChange')![0]).toEqual(['dlq']);
  });

  it('shows counts and the aggregated dot when provided', async () => {
    localStorage.setItem('harness-show-counters', 'true');
    const wrapper = mountHeader({
      activeTab: 'sysctl',
      debugCount: 5,
      showChatStar: true,
      dlqCount: 2,
    });
    expect(wrapper.find('.nav-menu__badge').exists()).toBe(true);
    await wrapper.find('.nav-menu__burger').trigger('click');
    expect(wrapper.text()).toContain('✦');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('5');
    localStorage.removeItem('harness-show-counters');
  });
});
