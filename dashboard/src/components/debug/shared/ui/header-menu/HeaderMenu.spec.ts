import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import HeaderMenu from './HeaderMenu.vue';

describe('HeaderMenu', () => {
  beforeEach(() => setActivePinia(createPinia()));
  it('renders filter buttons', () => {
    const wrapper = mount(HeaderMenu, {
      props: {
        filter: 'all',
        search: '',
        allCount: 10,
        httpCount: 7,
        socketCount: 3,
      },
    });
    expect(wrapper.text()).toContain('ALL');
    expect(wrapper.text()).toContain('HTTP');
    expect(wrapper.text()).toContain('SOCKET');
  });

  it('emits update:filter when a filter button is clicked', async () => {
    const wrapper = mount(HeaderMenu, {
      props: {
        filter: 'all',
        search: '',
        allCount: 10,
        httpCount: 7,
        socketCount: 3,
      },
    });
    const httpButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('HTTP'));
    expect(httpButton).toBeDefined();
    await httpButton!.trigger('click');
    expect(wrapper.emitted('update:filter')).toBeTruthy();
    expect(wrapper.emitted('update:filter')![0]).toEqual(['http']);
  });

  it('emits clear only after a confirming second click', async () => {
    const wrapper = mount(HeaderMenu, {
      props: {
        filter: 'all',
        search: '',
        allCount: 5,
        httpCount: 3,
        socketCount: 2,
      },
    });
    const buttons = wrapper.findAll('button');
    const trashButton = buttons[buttons.length - 1];
    await trashButton!.trigger('click');
    expect(wrapper.emitted('clear')).toBeUndefined();
    await trashButton!.trigger('click');
    expect(wrapper.emitted('clear')).toBeTruthy();
  });

  it('disables HTTP and trash buttons when counts are zero', () => {
    const wrapper = mount(HeaderMenu, {
      props: {
        filter: 'all',
        search: '',
        allCount: 0,
        httpCount: 0,
        socketCount: 0,
      },
    });
    const httpButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('HTTP'));
    expect((httpButton!.element as HTMLButtonElement).disabled).toBe(true);

    const allButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('ALL'));
    expect((allButton!.element as HTMLButtonElement).disabled).toBe(true);

    const buttons = wrapper.findAll('button');
    const trashButton = buttons[buttons.length - 1];
    expect((trashButton!.element as HTMLButtonElement).disabled).toBe(true);
  });
});
