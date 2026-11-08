import { ListFilter } from '@lucide/vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import FilterMenu from './FilterMenu.vue';

const baseProps = {
  isOpen: true,
  isActive: false,
  title: 'Status',
  width: '8rem',
  icon: ListFilter,
  options: [
    { value: 'Failed', label: 'Failed' },
    { value: 'Active', label: 'Active' },
    { value: 'Cleared', label: 'Cleared' },
  ],
  selectedValue: '',
};

const wrappers: VueWrapper[] = [];

function mountMenu(props: Partial<typeof baseProps> = {}) {
  const wrapper = mount(FilterMenu, {
    props: { ...baseProps, ...props },
    attachTo: document.body,
  });
  wrappers.push(wrapper);
  return wrapper;
}

describe('FilterMenu', () => {
  afterEach(() => {
    for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    document.body.innerHTML = '';
  });

  it('renders all options in the teleported dropdown when open', () => {
    mountMenu();
    expect(document.querySelectorAll('.filter-menu__option')).toHaveLength(3);
  });

  it('emits select with the chosen option', async () => {
    const wrapper = mountMenu();
    const option = document.querySelector<HTMLButtonElement>(
      '.filter-menu__option',
    );
    option?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('select')?.[0]).toEqual(['Failed']);
  });

  it('emits toggle when the trigger is clicked', async () => {
    const wrapper = mountMenu();
    await wrapper.find('.filter-menu-trigger').trigger('click');
    expect(wrapper.emitted('toggle')).toBeTruthy();
  });

  it('emits close from the dropdown backdrop', async () => {
    const wrapper = mountMenu();
    const backdrop = document.querySelector<HTMLDivElement>(
      '.filter-menu-trigger__backdrop',
    );
    backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does not render the dropdown when closed', () => {
    mountMenu({ isOpen: false });
    expect(document.querySelector('.filter-menu-trigger__dropdown')).toBeNull();
  });
});
