import { Search } from '@lucide/vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import Tooltip from '../tooltip/Tooltip.vue';
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

  it('emits click with the native event payload', async () => {
    const wrapper = mount(IconButton, { props: { title: 'Search' } });
    await button(wrapper).trigger('click');
    const payload = wrapper.emitted('click')?.[0]?.[0];
    expect(payload).toBeInstanceOf(MouseEvent);
  });

  it('emits hover and focus events', async () => {
    const wrapper = mount(IconButton, { props: { title: 'Search' } });
    await button(wrapper).trigger('mouseenter');
    await button(wrapper).trigger('mouseleave');
    await button(wrapper).trigger('focus');
    await button(wrapper).trigger('blur');
    expect(wrapper.emitted('mouseenter')).toHaveLength(1);
    expect(wrapper.emitted('mouseleave')).toHaveLength(1);
    expect(wrapper.emitted('focus')).toHaveLength(1);
    expect(wrapper.emitted('blur')).toHaveLength(1);
  });

  it('renders a type=button element', () => {
    const wrapper = mount(IconButton, { props: { title: 'Search' } });
    expect((button(wrapper).element as HTMLButtonElement).type).toBe('button');
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

  it('applies the blinking class', () => {
    const wrapper = mount(IconButton, { props: { blinking: true } });
    expect(button(wrapper).classes()).toContain('icon-button--blinking');
  });

  it('applies the compact sm class', () => {
    const wrapper = mount(IconButton, { props: { size: 'sm' } });
    expect(button(wrapper).classes()).toContain('icon-button--sm');
  });

  it('keeps the md scale by default', () => {
    const wrapper = mount(IconButton, {});
    expect(button(wrapper).classes()).not.toContain('icon-button--sm');
  });

  it('forwards tooltip positions to the Tooltip', () => {
    const wrapper = mount(IconButton, {
      props: { title: 'Search', tooltipPositions: ['bottom', 'top'] },
    });
    expect(wrapper.findComponent(Tooltip).props('positions')).toEqual([
      'bottom',
      'top',
    ]);
  });

  it('disables the button', () => {
    const wrapper = mount(IconButton, { props: { disabled: true } });
    expect((button(wrapper).element as HTMLButtonElement).disabled).toBe(true);
  });

  it('falls back to title for the aria-label', () => {
    const wrapper = mount(IconButton, { props: { title: 'Search' } });
    expect(button(wrapper).attributes('aria-label')).toBe('Search');
  });

  it('prefers an explicit aria-label over the title', () => {
    const wrapper = mount(IconButton, {
      props: { title: 'Search', ariaLabel: 'Find' },
    });
    expect(button(wrapper).attributes('aria-label')).toBe('Find');
  });

  it('reflects aria-pressed for toggle semantics', () => {
    const wrapper = mount(IconButton, { props: { ariaPressed: true } });
    expect(button(wrapper).attributes('aria-pressed')).toBe('true');
  });
});
