import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { appViewContextKey } from '@/composables/use-app-view-context';
import { mockAppViewContext } from '@/test-utils/mock-app-view-context';

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
});
