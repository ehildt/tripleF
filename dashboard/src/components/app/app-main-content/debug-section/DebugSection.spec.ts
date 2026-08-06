import { mount, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { computed, nextTick } from 'vue';

import { appViewContextKey } from '@/composables/use-app-view-context';
import { useDebugStore } from '@/stores/debug';
import {
  makeMockSocketProvider,
  mockAppViewContext,
} from '@/test-utils/mock-app-view-context';
import type { DebugResult } from '@/types/debug.model';

import DebugSection from './DebugSection.vue';

vi.mock('../../../../components/debug/Debug.vue', () => ({
  default: {
    props: ['results', 'selectedResult'],
    template:
      '<div class="debug-mock" @clear="$emit(\'clear\')" @select="$emit(\'select\', $event)" @mark-read="$emit(\'markRead\', $event)">Debug</div>',
    emits: ['clear', 'select', 'markRead'],
  },
}));

vi.mock(
  '../../../../components/debug/request-details/RequestDetails.vue',
  () => ({
    default: {
      props: ['result'],
      template: '<div class="request-details-mock">RequestDetails</div>',
    },
  }),
);

describe('DebugSection', () => {
  function mountSection() {
    const clearDebugResults = vi.fn();
    const selectDebugResult = vi.fn();
    const selectDebugMarkRead = vi.fn();
    const wrapper = mount(DebugSection, {
      global: {
        provide: {
          [appViewContextKey]: mockAppViewContext({
            debugResults: [],
            selectedDebugResult: null,
            clearDebugResults,
            selectDebugResult,
            selectDebugMarkRead,
          }),
        },
      },
    });

    return {
      wrapper,
      clearDebugResults,
      selectDebugResult,
      selectDebugMarkRead,
    };
  }

  it('renders debug and request details panels', () => {
    const { wrapper } = mountSection();

    expect(wrapper.find('.debug-mock').exists()).toBe(true);
    expect(wrapper.find('.request-details-mock').exists()).toBe(true);
  });

  it('calls clearDebugResults when Debug clears', () => {
    const { wrapper, clearDebugResults } = mountSection();
    const debug = wrapper.findComponent('.debug-mock') as VueWrapper;
    debug.vm.$emit('clear');

    expect(clearDebugResults).toHaveBeenCalled();
  });

  it('calls selectDebugResult when Debug selects', () => {
    const { wrapper, selectDebugResult } = mountSection();
    const debug = wrapper.findComponent('.debug-mock') as VueWrapper;
    const result = { id: '1' };
    debug.vm.$emit('select', result);

    expect(selectDebugResult).toHaveBeenCalledWith(result);
  });

  it('calls selectDebugMarkRead when Debug marks read', () => {
    const { wrapper, selectDebugMarkRead } = mountSection();
    const debug = wrapper.findComponent('.debug-mock') as VueWrapper;
    debug.vm.$emit('markRead', '1');

    expect(selectDebugMarkRead).toHaveBeenCalledWith('1');
  });

  it('updates the details panel reactively when a request is selected', async () => {
    // Mirrors the real App.vue provide: store-derived fields are computed
    // refs, and selectDebugResult mutates the store — so selecting a request
    // must surface in the RequestDetails panel. Regression: the context used
    // to provide a one-time unwrapped snapshot, so the detail never updated.
    const pinia = createPinia();
    setActivePinia(pinia);
    const debugStore = useDebugStore();
    const result = { id: 'req-1', endpoint: '/api/health' } as DebugResult;

    const wrapper = mount(DebugSection, {
      global: {
        provide: {
          [appViewContextKey]: {
            socketProvider: makeMockSocketProvider(),
            viewModels: computed(() => []),
            debugResults: computed(() => [result]),
            selectedDebugResult: computed(() => debugStore.selectedDebugResult),
            clearDebugResults: vi.fn(),
            selectDebugResult: (r) => {
              debugStore.selectedDebugResult = r;
            },
            selectDebugMarkRead: vi.fn(),
          },
        },
      },
    });

    // Before selecting, the details mock has no result.
    expect(
      wrapper.findComponent('.request-details-mock').props('result'),
    ).toBeNull();

    const debug = wrapper.findComponent('.debug-mock') as VueWrapper;
    debug.vm.$emit('select', result);
    await nextTick();

    // The panel now receives the selected result via the reactive context.
    expect(
      wrapper.findComponent('.request-details-mock').props('result'),
    ).toEqual(result);
  });
});
