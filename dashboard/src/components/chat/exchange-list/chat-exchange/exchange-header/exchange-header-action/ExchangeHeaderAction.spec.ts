import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ExchangeHeaderAction from './ExchangeHeaderAction.vue';

describe('ExchangeHeaderAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits click on click', async () => {
    const wrapper = mount(ExchangeHeaderAction, {
      props: { title: 'Copy' },
      slots: { default: '<svg />' },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('adds the pressed class on click for feedback', async () => {
    const wrapper = mount(ExchangeHeaderAction, {
      props: { title: 'Copy' },
      slots: { default: '<svg />' },
    });

    expect(wrapper.classes()).not.toContain('header-action--pressed');
    await wrapper.trigger('click');
    expect(wrapper.classes()).toContain('header-action--pressed');
  });

  it('removes the pressed class after the pulse animation', async () => {
    const wrapper = mount(ExchangeHeaderAction, {
      props: { title: 'Copy' },
      slots: { default: '<svg />' },
    });

    await wrapper.trigger('click');
    expect(wrapper.classes()).toContain('header-action--pressed');

    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();
    expect(wrapper.classes()).not.toContain('header-action--pressed');
  });

  it('emits hover start and end', async () => {
    const wrapper = mount(ExchangeHeaderAction, {
      props: { title: 'Copy' },
      slots: { default: '<svg />' },
    });

    await wrapper.trigger('mouseenter');
    await wrapper.trigger('mouseleave');
    expect(wrapper.emitted('hoverStart')).toHaveLength(1);
    expect(wrapper.emitted('hoverEnd')).toHaveLength(1);
  });
});
