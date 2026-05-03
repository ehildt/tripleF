import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

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
  const defaultProps = {
    debugResults: [],
    selectedDebugResult: null,
  };

  it('renders debug and request details panels', () => {
    const wrapper = mount(DebugSection, {
      props: defaultProps,
    });

    expect(wrapper.find('.debug-mock').exists()).toBe(true);
    expect(wrapper.find('.request-details-mock').exists()).toBe(true);
  });

  it('forwards clearDebugResults event', () => {
    const wrapper = mount(DebugSection, {
      props: defaultProps,
    });

    const debug = wrapper.findComponent('.debug-mock') as VueWrapper;
    debug.vm.$emit('clear');

    expect(wrapper.emitted('clearDebugResults')).toBeTruthy();
  });

  it('forwards selectDebugResult event', () => {
    const wrapper = mount(DebugSection, {
      props: defaultProps,
    });

    const debug = wrapper.findComponent('.debug-mock') as VueWrapper;
    const result = { id: '1' };
    debug.vm.$emit('select', result);

    expect(wrapper.emitted('selectDebugResult')).toBeTruthy();
    expect(wrapper.emitted('selectDebugResult')![0]).toEqual([result]);
  });

  it('forwards selectDebugMarkRead event', () => {
    const wrapper = mount(DebugSection, {
      props: defaultProps,
    });

    const debug = wrapper.findComponent('.debug-mock') as VueWrapper;
    debug.vm.$emit('markRead', '1');

    expect(wrapper.emitted('selectDebugMarkRead')).toBeTruthy();
    expect(wrapper.emitted('selectDebugMarkRead')![0]).toEqual(['1']);
  });
});
