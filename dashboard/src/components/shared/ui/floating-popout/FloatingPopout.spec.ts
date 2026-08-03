import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FloatingPopout from './FloatingPopout.vue';

function mountComponent(
  props: Partial<InstanceType<typeof FloatingPopout>['$props']> = {},
) {
  return mount(FloatingPopout, {
    props: {
      title: 'Some video',
      showTitleMarquee: false,
      opacityPercent: 100,
      isInPlaylist: false,
      minimizeTitle: 'Minimize',
      closeTitle: 'Close',
      ...props,
    } as InstanceType<typeof FloatingPopout>['$props'],
    slots: {
      default: '<div class="media-slot">media</div>',
    },
  });
}

describe('FloatingPopout', () => {
  it('renders the bar and slotted media', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.floating-media-bar').exists()).toBe(true);
    expect(wrapper.find('.media-slot').text()).toBe('media');
  });

  it('renders the resize handle grid', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.resize-handle-grid__handle').exists()).toBe(true);
  });

  it('hides bar and handles and keeps media when docked', () => {
    const wrapper = mountComponent({ docked: true });
    expect(wrapper.classes()).toContain('floating-popout--docked');
    expect(wrapper.find('.floating-media-bar').exists()).toBe(false);
    expect(wrapper.find('.resize-handle-grid__handle').exists()).toBe(false);
    expect(wrapper.find('.media-slot').text()).toBe('media');
  });

  it('forwards minimize', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar__minimize').trigger('click');
    expect(wrapper.emitted('minimize')).toBeTruthy();
  });

  it('forwards close', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar__close').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('forwards togglePlaylist', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar__playlist-toggle').trigger('click');
    expect(wrapper.emitted('togglePlaylist')).toBeTruthy();
  });

  it('forwards drag from the bar', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar').trigger('pointerdown');
    expect(wrapper.emitted('drag')).toBeTruthy();
  });

  it('forwards opacityInput with the slider value', async () => {
    const wrapper = mountComponent();
    const slider = wrapper.find('.floating-media-bar__opacity-slider');
    (slider.element as HTMLInputElement).value = '55';
    await slider.trigger('input');
    expect(wrapper.emitted('opacityInput')).toEqual([[55]]);
  });

  it('forwards resize from a handle', async () => {
    const wrapper = mountComponent();
    const handle = wrapper.find('.resize-handle-grid__handle');
    await handle.trigger('pointerdown');
    const resize = wrapper.emitted('resize');
    expect(resize).toBeTruthy();
    expect(resize![0][0]).toBeTypeOf('string');
  });
});
