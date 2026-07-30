import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FloatingMediaBar from './FloatingMediaBar.vue';

function mountComponent(
  props: Partial<InstanceType<typeof FloatingMediaBar>['$props']> = {},
) {
  return mount(FloatingMediaBar, {
    props: {
      title: 'Some video',
      showTitleMarquee: false,
      opacityPercent: 100,
      isInPlaylist: false,
      closeTitle: 'Close video',
      ...props,
    } as InstanceType<typeof FloatingMediaBar>['$props'],
  });
}

describe('FloatingMediaBar', () => {
  it('shows the title statically by default', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.floating-media-bar__title').text()).toBe(
      'Some video',
    );
    expect(wrapper.find('.floating-media-bar__marquee-track').exists()).toBe(
      false,
    );
  });

  it('renders the marquee when requested', () => {
    const wrapper = mountComponent({ showTitleMarquee: true });
    const texts = wrapper.findAll('.floating-media-bar__marquee-text');
    expect(texts).toHaveLength(2);
    expect(texts[0].text()).toBe('Some video');
    expect(texts[1].attributes('aria-hidden')).toBe('true');
  });

  it('shows the add-to-playlist icon with an add tooltip', () => {
    const wrapper = mountComponent({ isInPlaylist: false });
    const toggle = wrapper.find('.floating-media-bar__playlist-toggle');
    expect(toggle.attributes('title')).toBe('Add to playlist');
    expect(toggle.attributes('aria-pressed')).toBe('false');
  });

  it('shows the remove state when the video is in the playlist', () => {
    const wrapper = mountComponent({ isInPlaylist: true });
    const toggle = wrapper.find('.floating-media-bar__playlist-toggle');
    expect(toggle.attributes('title')).toBe('Remove from playlist');
    expect(toggle.attributes('aria-pressed')).toBe('true');
    expect(toggle.classes()).toContain(
      'floating-media-bar__playlist-toggle--added',
    );
  });

  it('emits togglePlaylist when the playlist button is clicked', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar__playlist-toggle').trigger('click');
    expect(wrapper.emitted('togglePlaylist')).toBeTruthy();
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar__close').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits opacityInput with the slider value', async () => {
    const wrapper = mountComponent();
    const slider = wrapper.find('.floating-media-bar__opacity-slider');
    (slider.element as HTMLInputElement).value = '55';
    await slider.trigger('input');
    expect(wrapper.emitted('opacityInput')).toEqual([[55]]);
  });

  it('emits drag from free bar space, not from the controls', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar').trigger('pointerdown');
    expect(wrapper.emitted('drag')).toBeTruthy();

    const clean = mountComponent();
    await clean
      .find('.floating-media-bar__playlist-toggle')
      .trigger('pointerdown');
    expect(clean.emitted('drag')).toBeFalsy();
  });
});
