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
      blinkLogo: false,
      debugCount: 0,
      ...props,
    } as any,
    global: { plugins: [pinia] },
  });
}

describe('AppHeader', () => {
  it('renders brand and version text', () => {
    const wrapper = mountHeader();
    expect(wrapper.text()).toContain('ckir.io');
    expect(wrapper.text()).toContain('harness');
    expect(wrapper.text()).toContain('AI Harness Console');
  });

  it('renders all four tabs', () => {
    const wrapper = mountHeader();
    expect(wrapper.text()).toContain('> CHAT_');
    expect(wrapper.text()).toContain('> DLQ_');
    expect(wrapper.text()).toContain('> DEBUG_');
    expect(wrapper.text()).toContain('> SYSCTL_');
  });

  it('emits tabChange when a tab is clicked', async () => {
    const wrapper = mountHeader();
    const buttons = wrapper.findAll('button');
    const dlqButton = buttons.find((b) => b.text().includes('DLQ'));
    expect(dlqButton).toBeDefined();
    await dlqButton!.trigger('click');
    expect(wrapper.emitted('tabChange')).toBeTruthy();
    expect(wrapper.emitted('tabChange')![0]).toEqual(['dlq']);
  });

  it('shows counts when provided', () => {
    localStorage.setItem('harness-show-counters', 'true');
    const wrapper = mountHeader({
      activeTab: 'sysctl',
      debugCount: 5,
      showChatStar: true,
      dlqCount: 2,
    });
    expect(wrapper.text()).toContain('✦');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('5');
    localStorage.removeItem('harness-show-counters');
  });
});
