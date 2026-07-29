import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FloatingVideoPopupBar from './FloatingVideoPopupBar.vue';

function mountComponent(
  props: Partial<InstanceType<typeof FloatingVideoPopupBar>['$props']> = {},
) {
  return mount(FloatingVideoPopupBar, {
    props: {
      title: 'Some video',
      showTitleMarquee: false,
      opacityPercent: 100,
      isInPlaylist: false,
      closeTitle: 'Close video',
      ...props,
    } as InstanceType<typeof FloatingVideoPopupBar>['$props'],
  });
}

describe('FloatingVideoPopupBar', () => {
  it('shows the title statically by default', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.floating-video-popup-bar__title').text()).toBe(
      'Some video',
    );
    expect(
      wrapper.find('.floating-video-popup-bar__marquee-track').exists(),
    ).toBe(false);
  });

  it('renders the marquee when the playlist panel is hidden', () => {
    const wrapper = mountComponent({ showTitleMarquee: true });
    const texts = wrapper.findAll('.floating-video-popup-bar__marquee-text');
    expect(texts).toHaveLength(2);
    expect(texts[0].text()).toBe('Some video');
    expect(texts[1].attributes('aria-hidden')).toBe('true');
  });

  it('shows the add-to-playlist icon with an add tooltip', () => {
    const wrapper = mountComponent({ isInPlaylist: false });
    const toggle = wrapper.find('.floating-video-popup-bar__playlist-toggle');
    expect(toggle.attributes('title')).toBe('Add to playlist');
    expect(toggle.attributes('aria-pressed')).toBe('false');
  });

  it('shows the remove state when the video is in the playlist', () => {
    const wrapper = mountComponent({ isInPlaylist: true });
    const toggle = wrapper.find('.floating-video-popup-bar__playlist-toggle');
    expect(toggle.attributes('title')).toBe('Remove from playlist');
    expect(toggle.attributes('aria-pressed')).toBe('true');
    expect(toggle.classes()).toContain(
      'floating-video-popup-bar__playlist-toggle--added',
    );
  });

  it('emits togglePlaylist when the playlist button is clicked', async () => {
    const wrapper = mountComponent();
    await wrapper
      .find('.floating-video-popup-bar__playlist-toggle')
      .trigger('click');
    expect(wrapper.emitted('togglePlaylist')).toBeTruthy();
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-video-popup-bar__close').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits opacityInput with the slider value', async () => {
    const wrapper = mountComponent();
    const slider = wrapper.find('.floating-video-popup-bar__opacity-slider');
    (slider.element as HTMLInputElement).value = '55';
    await slider.trigger('input');
    expect(wrapper.emitted('opacityInput')).toEqual([[55]]);
  });

  it('emits drag from free bar space, not from the controls', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-video-popup-bar').trigger('pointerdown');
    expect(wrapper.emitted('drag')).toBeTruthy();

    const clean = mountComponent();
    await clean
      .find('.floating-video-popup-bar__playlist-toggle')
      .trigger('pointerdown');
    expect(clean.emitted('drag')).toBeFalsy();
  });
});
