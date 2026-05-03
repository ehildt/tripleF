import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import Debug from './Debug.vue';

vi.mock('../../stores/debug', () => ({
  useDebugStore: () => ({
    isDebugRead: vi.fn(() => false),
  }),
}));

vi.mock('../shared/ui/panel-layout/PanelLayout.vue', () => ({
  default: { template: '<div class="layout"><slot /></div>' },
}));
vi.mock('../shared/ui/panel-header/PanelHeader.vue', () => ({
  default: { template: '<div class="header"><slot /></div>' },
}));
vi.mock('../shared/ui/panel-header-title/PanelHeaderTitle.vue', () => ({
  default: { template: '<span>{{ label }}</span>', props: ['label'] },
}));
vi.mock('../shared/ui/panel-empty-state/PanelEmptyState.vue', () => ({
  default: { template: '<div class="empty">No requests</div>' },
}));
vi.mock('./shared/ui/header-menu/HeaderMenu.vue', () => ({
  default: {
    props: ['filter', 'allCount', 'httpCount', 'socketCount'],
    template: '<div class="menu"></div>',
  },
}));
vi.mock('./request-list/RequestList.vue', () => ({
  default: {
    props: ['results', 'selectedResultId', 'isRead'],
    template: '<div class="results"></div>',
  },
}));

describe('Debug', () => {
  setActivePinia(createPinia());

  const results = [
    { id: '1', type: 'http' },
    { id: '2', type: 'socket' },
    { id: '3', type: 'http' },
  ] as any[];

  it('renders the request list when results exist', () => {
    const wrapper = mount(Debug, {
      props: { results, selectedResult: null },
    });
    expect(wrapper.find('.results').exists()).toBe(true);
    expect(wrapper.find('.empty').exists()).toBe(false);
  });

  it('renders the empty state when no results', () => {
    const wrapper = mount(Debug, {
      props: { results: [], selectedResult: null },
    });
    expect(wrapper.find('.empty').exists()).toBe(true);
    expect(wrapper.find('.results').exists()).toBe(false);
  });

  it('emits select with the result', async () => {
    const wrapper = mount(Debug, {
      props: { results, selectedResult: null },
    });
    const vm = wrapper.vm as any;
    vm.select(results[0]);
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')![0]).toEqual([results[0]]);
  });

  it('toggles selection off when the same result is clicked', async () => {
    const wrapper = mount(Debug, {
      props: { results, selectedResult: results[0] },
    });
    const vm = wrapper.vm as any;
    vm.select(results[0]);
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')![0]).toEqual([null]);
  });

  it('filters http only', async () => {
    const wrapper = mount(Debug, {
      props: { results, selectedResult: null },
    });
    const vm = wrapper.vm as any;
    vm.filter = 'http';
    await wrapper.vm.$nextTick();
    expect(vm.filteredResults.length).toBe(2);
  });

  it('filters socket only', async () => {
    const wrapper = mount(Debug, {
      props: { results, selectedResult: null },
    });
    const vm = wrapper.vm as any;
    vm.filter = 'socket';
    await wrapper.vm.$nextTick();
    expect(vm.filteredResults.length).toBe(1);
  });
});
