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
    expect(wrapper.find('.marquee__track').exists()).toBe(false);
  });

  it('renders the marquee when requested', () => {
    const wrapper = mountComponent({ showTitleMarquee: true });
    const texts = wrapper.findAll('.marquee__text');
    expect(texts).toHaveLength(2);
    expect(texts[0].text()).toBe('Some video');
    expect(texts[1].attributes('aria-hidden')).toBe('true');
  });

  it('shows the add-to-playlist icon with an add tooltip', () => {
    const wrapper = mountComponent({ isInPlaylist: false });
    const toggle = wrapper.find('.icon-button');
    expect(toggle.attributes('aria-label')).toBe('Add to playlist');
    expect(toggle.attributes('aria-pressed')).toBe('false');
  });

  it('shows the remove state when the video is in the playlist', () => {
    const wrapper = mountComponent({ isInPlaylist: true });
    const toggle = wrapper.find('.icon-button');
    expect(toggle.attributes('aria-label')).toBe('Remove from playlist');
    expect(toggle.attributes('aria-pressed')).toBe('true');
    expect(toggle.classes()).toContain('icon-button--active');
  });

  it.each([
    {
      selector: '.icon-button',
      event: 'togglePlaylist',
    },
    { selector: '.floating-media-bar__minimize', event: 'minimize' },
    { selector: '.floating-media-bar__close', event: 'close' },
  ])(
    'emits $event when the corresponding button is clicked',
    async ({ selector, event }) => {
      const wrapper = mountComponent();
      await wrapper.find(selector).trigger('click');
      expect(wrapper.emitted(event)).toBeTruthy();
    },
  );

  it('toggles opacity from 100 to 66 when the mirror icon is clicked', async () => {
    const wrapper = mountComponent({ opacityPercent: 100 });
    await wrapper.find('.floating-media-bar__opacity-toggle').trigger('click');
    expect(wrapper.emitted('opacityInput')).toEqual([[66]]);
  });

  it('toggles opacity back to 100 when clicked while translucent', async () => {
    const wrapper = mountComponent({ opacityPercent: 66 });
    await wrapper.find('.floating-media-bar__opacity-toggle').trigger('click');
    expect(wrapper.emitted('opacityInput')).toEqual([[100]]);
  });

  it('marks the opacity toggle as translucent below full opacity', () => {
    const wrapper = mountComponent({ opacityPercent: 66 });
    expect(
      wrapper.find('.floating-media-bar__opacity-toggle').classes(),
    ).toContain('floating-media-bar__opacity-toggle--translucent');
  });

  it('emits drag from free bar space, not from the controls', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar').trigger('pointerdown');
    expect(wrapper.emitted('drag')).toBeTruthy();

    const clean = mountComponent();
    await clean.find('.icon-button').trigger('pointerdown');
    expect(clean.emitted('drag')).toBeFalsy();
  });
});
