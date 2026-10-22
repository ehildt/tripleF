import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PlaylistMenuItem from './PlaylistMenuItem.vue';

function mountItem(name: string, isActive = false) {
  return mount(PlaylistMenuItem, { props: { name, isActive } });
}

describe('PlaylistMenuItem', () => {
  it('the field is read-only until Edit is clicked', async () => {
    const wrapper = mountItem('Focus');
    const input = wrapper.find('.playlist-menu-item__input');
    expect(input.attributes('readonly')).toBeDefined();
    await wrapper.find('button[aria-label="Rename playlist"]').trigger('click');
    expect(
      wrapper.find('.playlist-menu-item__input').attributes('readonly'),
    ).toBeUndefined();
  });

  it('clicking the read-only field loads the playlist', async () => {
    const wrapper = mountItem('Focus');
    await wrapper.find('.playlist-menu-item__input').trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
  });

  it('blurring an unchanged field emits nothing', async () => {
    const wrapper = mountItem('Focus');
    const input = wrapper.find('.playlist-menu-item__input');
    await wrapper.find('button[aria-label="Rename playlist"]').trigger('click');
    await input.trigger('blur');
    expect(wrapper.emitted('rename')).toBeFalsy();
    expect(wrapper.emitted('delete')).toBeFalsy();
  });

  it('blurring an edited field renames the playlist', async () => {
    const wrapper = mountItem('Focus');
    const input = wrapper.find('.playlist-menu-item__input');
    await wrapper.find('button[aria-label="Rename playlist"]').trigger('click');
    await input.setValue('Chill');
    await input.trigger('blur');
    expect(wrapper.emitted('rename')).toEqual([['Chill']]);
  });

  it('blurring an emptied field deletes the playlist', async () => {
    const wrapper = mountItem('Focus');
    const input = wrapper.find('.playlist-menu-item__input');
    await wrapper.find('button[aria-label="Rename playlist"]').trigger('click');
    await input.setValue('   ');
    await input.trigger('blur');
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('rename')).toBeFalsy();
  });

  it('the Trash button deletes the playlist', async () => {
    const wrapper = mountItem('Focus');
    await wrapper
      .find('button[aria-label="Delete playlist Focus"]')
      .trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });
});
