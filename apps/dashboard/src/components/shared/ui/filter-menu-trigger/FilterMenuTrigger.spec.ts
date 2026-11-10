import { ListFilter } from '@lucide/vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import FilterMenuTrigger from './FilterMenuTrigger.vue';

const wrappers: VueWrapper[] = [];

function mountTrigger(isOpen = true) {
  const wrapper = mount(FilterMenuTrigger, {
    props: {
      isOpen,
      isActive: false,
      title: 'Status',
      width: '8rem',
      icon: ListFilter,
    },
    slots: { default: '<span class="menu-body">Menu body</span>' },
    attachTo: document.body,
  });
  wrappers.push(wrapper);
  return wrapper;
}

describe('FilterMenuTrigger', () => {
  afterEach(() => {
    for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    document.body.innerHTML = '';
  });

  it('renders the trigger icon with the accessible state', () => {
    const wrapper = mountTrigger();
    const trigger = wrapper.find('.filter-menu-trigger');

    expect(trigger.exists()).toBe(true);
    expect(trigger.attributes('aria-label')).toBe('Status');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('.filter-menu-trigger__icon').exists()).toBe(true);
  });

  it('emits toggle when the trigger is clicked', async () => {
    const wrapper = mountTrigger();

    await wrapper.find('.filter-menu-trigger').trigger('click');

    expect(wrapper.emitted('toggle')).toBeTruthy();
  });

  it('teleports the dropdown with slot content when open', () => {
    mountTrigger();

    const dropdown = document.querySelector('.filter-menu-trigger__dropdown');
    expect(dropdown).not.toBeNull();
    expect(dropdown?.textContent).toContain('Menu body');
  });

  it('emits close when the backdrop is clicked', async () => {
    const wrapper = mountTrigger();

    const backdrop = document.querySelector<HTMLDivElement>(
      '.filter-menu-trigger__backdrop',
    );
    backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does not render the dropdown when closed', () => {
    mountTrigger(false);

    expect(document.querySelector('.filter-menu-trigger__dropdown')).toBeNull();
  });
});
