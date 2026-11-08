import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { useActiveTab } from './use-active-tab';

const Probe = defineComponent({
  setup() {
    const { activeTab } = useActiveTab();
    return () => h('div', activeTab.value);
  },
});

describe('useActiveTab', () => {
  it('derives each supported tab from the current route', async () => {
    const component = { template: '<div />' };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/chat', name: 'chat', component },
        { path: '/memory', name: 'memory', component },
        { path: '/dlq', name: 'dlq', component },
        { path: '/debug', name: 'debug', component },
        { path: '/settings', name: 'settings', component },
      ],
    });
    await router.push('/chat');
    await router.isReady();
    const wrapper = mount(Probe, { global: { plugins: [router] } });
    expect(wrapper.text()).toBe('chat');

    for (const tab of ['memory', 'dlq', 'debug', 'settings']) {
      await router.push(`/${tab}`);
      await nextTick();
      expect(wrapper.text()).toBe(tab);
    }
    wrapper.unmount();
  });
});
