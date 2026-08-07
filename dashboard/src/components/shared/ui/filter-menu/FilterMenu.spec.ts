import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FilterMenu from './FilterMenu.vue';

describe('FilterMenu', () => {
  const baseProps = {
    isOpen: true,
    isActive: false,
    title: 'Status',
    width: '8rem',
    options: [
      { value: 'Failed', label: 'Failed' },
      { value: 'Active', label: 'Active' },
      { value: 'Cleared', label: 'Cleared' },
    ],
    selectedValue: '',
  };

  it('renders all options when open', () => {
    const wrapper = mount(FilterMenu, { props: baseProps });
    const options = wrapper.findAll('.filter-menu__option');
    expect(options).toHaveLength(3);
  });

  it('emits select with the chosen option', () => {
    const wrapper = mount(FilterMenu, { props: baseProps });
    const options = wrapper.findAll('.filter-menu__option');
    options[0].trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual(['Failed']);
  });

  it('emits toggle when the trigger is clicked', () => {
    const wrapper = mount(FilterMenu, { props: baseProps });
    wrapper.find('.filter-menu__trigger').trigger('click');
    expect(wrapper.emitted('toggle')).toBeTruthy();
  });

  it('renders a text input instead of options when hasTextValue is true', () => {
    const wrapper = mount(FilterMenu, {
      props: { ...baseProps, hasTextValue: true, title: 'Search' },
    });
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.findAll('.filter-menu__option')).toHaveLength(0);
  });

  it('does not render the dropdown when closed', () => {
    const wrapper = mount(FilterMenu, {
      props: { ...baseProps, isOpen: false },
    });
    expect(wrapper.find('.filter-menu__dropdown').exists()).toBe(false);
  });
});
