import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useNavigationStore } from '@/stores/app/navigation/navigation.store';

import { useChatResponseActivity } from './use-chat-response-activity';

const routeState = vi.hoisted(() => ({ activeTab: 'chat' }));

vi.mock('./use-active-tab', async () => {
  const { computed } = await import('vue');
  return {
    useActiveTab: () => ({
      activeTab: computed(() => routeState.activeTab),
    }),
  };
});

let notifyChatResponse: () => void;
const Probe = defineComponent({
  setup() {
    ({ notifyChatResponse } = useChatResponseActivity());
    return () => h('div');
  },
});

describe('useChatResponseActivity', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    routeState.activeTab = 'chat';
  });

  it('does not mark activity while Chat is active', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mount(Probe, { global: { plugins: [pinia] } });
    notifyChatResponse();
    expect(useNavigationStore().showChatStar).toBe(false);
    wrapper.unmount();
  });

  it('marks activity for a response while another tab is active', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    routeState.activeTab = 'memory';
    const wrapper = mount(Probe, { global: { plugins: [pinia] } });
    notifyChatResponse();
    expect(useNavigationStore().showChatStar).toBe(true);
    wrapper.unmount();
  });
});
