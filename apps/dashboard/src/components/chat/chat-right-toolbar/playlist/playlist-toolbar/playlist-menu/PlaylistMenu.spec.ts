import { Library, ListVideo } from '@lucide/vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import PlaylistMenu from './PlaylistMenu.vue';

function mountMenu(activePlaylistName = 'Focus mix') {
  return mount(PlaylistMenu, {
    props: {
      playlistName: 'New mix',
      playlists: ['Focus mix'],
      activePlaylistName,
    },
  });
}

describe('PlaylistMenu', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses the list-video trigger and emits file actions', async () => {
    const wrapper = mountMenu();
    expect(wrapper.findComponent(ListVideo).exists()).toBe(true);
    expect(wrapper.findComponent(Library).exists()).toBe(false);

    await wrapper.find('.playlist-menu__trigger').trigger('click');
    expect(
      wrapper.find('.playlist-name-row__input').attributes('placeholder'),
    ).toBe('Playlist name');
    expect(wrapper.findAll('.playlist-name-row__actions button')).toHaveLength(
      2,
    );
    await wrapper
      .find('button[aria-label="Load playlist from file"]')
      .trigger('click');
    await wrapper
      .find('button[aria-label="Save playlist Focus mix to file"]')
      .trigger('click');
    await wrapper.find('button[aria-label="Save playlist"]').trigger('click');

    expect(wrapper.emitted('loadFile')).toHaveLength(1);
    expect(wrapper.emitted('saveFile')).toEqual([['Focus mix']]);
    expect(wrapper.emitted('create')).toHaveLength(1);
    wrapper.unmount();
  });

  it('forwards name edits and closes from the name row', async () => {
    const wrapper = mountMenu();
    await wrapper.find('.playlist-menu__trigger').trigger('click');
    const input = wrapper.find('.playlist-name-row__input');

    await input.setValue('Chill');
    await input.trigger('keydown.enter');
    await input.trigger('keydown.esc');

    expect(wrapper.emitted('update:playlistName')?.at(-1)).toEqual(['Chill']);
    expect(wrapper.emitted('create')).toHaveLength(1);
    expect(wrapper.find('.playlist-menu__menu').exists()).toBe(false);
    wrapper.unmount();
  });

  it('keeps Load available and disables Add for an empty draft', async () => {
    const wrapper = mountMenu('');
    await wrapper.setProps({ playlistName: '' });
    await wrapper.find('.playlist-menu__trigger').trigger('click');
    const load = wrapper.find('button[aria-label="Load playlist from file"]');
    const add = wrapper.find('button[aria-label="Save playlist"]');

    expect(load.attributes('disabled')).toBeUndefined();
    expect(add.attributes('disabled')).toBeDefined();
    await load.trigger('click');
    await add.trigger('click');

    expect(wrapper.emitted('loadFile')).toHaveLength(1);
    expect(wrapper.emitted('create')).toBeUndefined();
    wrapper.unmount();
  });
});
