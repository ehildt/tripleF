import { Search } from '@lucide/vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import TextFilterMenu from './TextFilterMenu.vue';

const wrappers: VueWrapper[] = [];

function mountMenu(isOpen = true) {
  const wrapper = mount(TextFilterMenu, {
    props: {
      isOpen,
      isActive: false,
      title: 'Search',
      width: '16rem',
      icon: Search,
      modelValue: '',
    },
    attachTo: document.body,
  });
  wrappers.push(wrapper);
  return wrapper;
}

describe('TextFilterMenu', () => {
  afterEach(() => {
    for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    document.body.innerHTML = '';
  });

  it('renders the search input and emits model updates', async () => {
    const wrapper = mountMenu();
    const input = document.querySelector<HTMLInputElement>(
      '.text-filter-menu__input',
    );
    expect(input).not.toBeNull();

    if (input) {
      input.value = 'room-1';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await wrapper.vm.$nextTick();
    }
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['room-1']);
  });

  it('does not render the input when closed', () => {
    mountMenu(false);
    expect(document.querySelector('.text-filter-menu__input')).toBeNull();
  });
});
