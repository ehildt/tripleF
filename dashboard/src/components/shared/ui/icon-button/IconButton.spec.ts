import { Search } from '@lucide/vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import IconButton from './IconButton.vue';

describe('IconButton', () => {
  const button = (wrapper: ReturnType<typeof mount>) => wrapper.find('button');

  it('renders slot content and emits click', async () => {
    const wrapper = mount(IconButton, {
      props: { title: 'Search' },
      slots: { default: () => h(Search) },
    });
    expect(wrapper.find('svg').exists()).toBe(true);
    await button(wrapper).trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('applies the active class', () => {
    const wrapper = mount(IconButton, { props: { active: true } });
    expect(button(wrapper).classes()).toContain('icon-button--active');
  });

  it('applies the danger class', () => {
    const wrapper = mount(IconButton, { props: { danger: true } });
    expect(button(wrapper).classes()).toContain('icon-button--danger');
  });

  it('applies the armed class', () => {
    const wrapper = mount(IconButton, { props: { armed: true } });
    expect(button(wrapper).classes()).toContain('icon-button--armed');
  });

  it('disables the button', () => {
    const wrapper = mount(IconButton, { props: { disabled: true } });
    expect((button(wrapper).element as HTMLButtonElement).disabled).toBe(true);
  });
});
