import { mount, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActiveTab } from '@/stores/app';

import AppMainContent from './AppMainContent.vue';

vi.mock('../../chat/Chat.vue', () => ({
  default: {
    template: '<div class="chat-section">Chat</div>',
  },
}));
vi.mock('../../dlq/Dlq.vue', () => ({
  default: {
    props: ['models'],
    template: '<div class="dlq-section">DLQ</div>',
  },
}));
vi.mock('./debug-section/DebugSection.vue', () => ({
  default: {
    props: ['debugResults', 'selectedDebugResult'],
    template:
      '<div class="debug-section" @clear-debug-results="$emit(\'clearDebugResults\')" @select-debug-result="$emit(\'selectDebugResult\', $event)" @select-debug-mark-read="$emit(\'selectDebugMarkRead\', $event)">Debug</div>',
    emits: ['clearDebugResults', 'selectDebugResult', 'selectDebugMarkRead'],
  },
}));
vi.mock('../../pproc/Pproc.vue', () => ({
  default: {
    template: '<div class="preprocessing-section">Preprocessing</div>',
  },
}));
vi.mock('./sysctl-section/SysCtlSection.vue', () => ({
  default: {
    template: '<div class="sysctl-section">SysCtl</div>',
  },
}));

describe('AppMainContent', () => {
  const defaultProps = {
    activeTab: 'http' as ActiveTab,
    socketProvider: {
      listenToEvent: vi.fn(),
      joinRoom: vi.fn(),
      getSocket: vi.fn(() => ({ connected: true })),
      addPendingMessage: vi.fn(),
      trackRequest: vi.fn(),
      connectedEvents: new Set(),
      connectedRooms: new Map(),
    } as any,
    models: ['llama'],
    debugResults: [],
    selectedDebugResult: null,
  };

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders chat section when activeTab is http', () => {
    const wrapper = mount(AppMainContent, {
      props: defaultProps,
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.find('.chat-section').exists()).toBe(true);
  });

  it('renders dlq section when activeTab is dlq', () => {
    const wrapper = mount(AppMainContent, {
      props: { ...defaultProps, activeTab: 'dlq' as ActiveTab },
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.find('.dlq-section').exists()).toBe(true);
  });

  it('renders preprocessing section when activeTab is preprocessing', () => {
    const wrapper = mount(AppMainContent, {
      props: { ...defaultProps, activeTab: 'preprocessing' as ActiveTab },
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.find('.preprocessing-section').exists()).toBe(true);
  });

  it('renders debug section when activeTab is debug', () => {
    const wrapper = mount(AppMainContent, {
      props: { ...defaultProps, activeTab: 'debug' as ActiveTab },
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.find('.debug-section').exists()).toBe(true);
  });

  it('renders sysctl section when activeTab is sysctl', () => {
    const wrapper = mount(AppMainContent, {
      props: { ...defaultProps, activeTab: 'sysctl' as ActiveTab },
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.find('.sysctl-section').exists()).toBe(true);
  });

  it('emits selectDebugResult from DebugSection', () => {
    const wrapper = mount(AppMainContent, {
      props: { ...defaultProps, activeTab: 'debug' as ActiveTab },
      global: { plugins: [createPinia()] },
    });
    const debugSection = wrapper.findComponent('.debug-section') as VueWrapper;
    debugSection.vm.$emit('selectDebugResult', { id: '1' });
    expect(wrapper.emitted('selectDebugResult')).toBeTruthy();
  });
});
