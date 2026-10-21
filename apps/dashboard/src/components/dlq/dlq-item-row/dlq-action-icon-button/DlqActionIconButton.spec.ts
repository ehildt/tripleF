import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import DlqActionIconButton from './DlqActionIconButton.vue';

describe('DlqActionIconButton', () => {
  it('renders when visible', () => {
    const wrapper = mount(DlqActionIconButton, {
      props: { icon: h('div', {}, 'icon'), tint: 0, visible: true },
    });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('does not render when not visible', () => {
    const wrapper = mount(DlqActionIconButton, {
      props: { icon: h('div', {}, 'icon'), tint: 0, visible: false },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('emits click event', () => {
    const wrapper = mount(DlqActionIconButton, {
      props: { icon: h('div', {}, 'icon'), tint: 0, visible: true },
    });
    wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('applies tint-based color interpolation', () => {
    const wrapper = mount(DlqActionIconButton, {
      props: { icon: h('div', {}, 'icon'), tint: 1, visible: true },
    });
    const style = wrapper.find('button').attributes('style');
    expect(style).toContain('color-mix');
    expect(style).toContain('var(--color-tab-rest)');
    expect(style).toContain('var(--color-tab-accent)');
  });
});
