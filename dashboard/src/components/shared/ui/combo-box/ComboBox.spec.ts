import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ComboBox from './ComboBox.vue';

function mountComponent(props = {}) {
  return mount(ComboBox, {
    props: {
      modelValue: '',
      options: [],
      placeholder: 'room',
      ...props,
    },
  });
}

describe('ComboBox', () => {
  it('renders a plain input with the placeholder when no options exist', () => {
    const wrapper = mountComponent();
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('placeholder')).toBe('room');
    expect(wrapper.find('.combo-box__trigger').exists()).toBe(false);
  });

  it('emits update:modelValue while typing in the plain input', async () => {
    const wrapper = mountComponent();
    await wrapper.find('input').setValue('room-42');
    expect(wrapper.emitted('update:modelValue')).toEqual([['room-42']]);
  });

  it('shows the placeholder in the trigger when options exist but no value', () => {
    const wrapper = mountComponent({ options: ['room-1'] });
    const trigger = wrapper.find('.combo-box__trigger');
    expect(trigger.text()).toContain('room');
    expect(wrapper.find('.combo-box__value--placeholder').exists()).toBe(true);
  });

  it('shows the current value in the trigger', () => {
    const wrapper = mountComponent({
      modelValue: 'room-9',
      options: ['room-1', 'room-9'],
    });
    expect(wrapper.find('.combo-box__trigger').text()).toContain('room-9');
    expect(wrapper.find('.combo-box__value--placeholder').exists()).toBe(false);
  });

  it('opens a menu with input, divider, and options on click', async () => {
    const wrapper = mountComponent({ options: ['room-1', 'room-2'] });
    await wrapper.find('.combo-box__trigger').trigger('click');

    const menu = wrapper.find('.combo-box__menu');
    expect(menu.exists()).toBe(true);
    expect(menu.find('input').exists()).toBe(true);
    expect(wrapper.find('.combo-box__divider').exists()).toBe(true);
    expect(wrapper.findAll('.combo-box__option')).toHaveLength(2);
  });

  it('selects an option and closes the menu', async () => {
    const wrapper = mountComponent({ options: ['room-1', 'room-2'] });
    await wrapper.find('.combo-box__trigger').trigger('click');
    await wrapper.findAll('.combo-box__option')[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['room-2']]);
    expect(wrapper.find('.combo-box__menu').exists()).toBe(false);
  });

  it('marks the matching option as selected', async () => {
    const wrapper = mountComponent({
      modelValue: 'room-2',
      options: ['room-1', 'room-2'],
    });
    await wrapper.find('.combo-box__trigger').trigger('click');

    const selected = wrapper.findAll('.combo-box__option--selected');
    expect(selected).toHaveLength(1);
    expect(selected[0].text()).toBe('room-2');
  });

  it('commits the typed value and closes on enter in the menu input', async () => {
    const wrapper = mountComponent({
      modelValue: 'room-new',
      options: ['room-1'],
    });
    await wrapper.find('.combo-box__trigger').trigger('click');
    await wrapper.find('.combo-box__menu input').trigger('keydown.enter');

    expect(wrapper.emitted('update:modelValue')).toEqual([['room-new']]);
    expect(wrapper.find('.combo-box__menu').exists()).toBe(false);
  });
});
