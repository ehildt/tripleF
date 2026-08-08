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

  it('keeps the bar visible by default', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.floating-media-bar').classes()).not.toContain(
      'floating-media-bar--collapsed',
    );
  });

  it('collapses the bar when auto-hide is on and the pointer is away', () => {
    const wrapper = mountComponent({ barAlwaysVisible: false });
    const bar = wrapper.find('.floating-media-bar');
    expect(bar.classes()).toContain('floating-media-bar--collapsed');
  });

  it('reveals the bar on mouse enter and hides it on mouse leave', async () => {
    const wrapper = mountComponent({ barAlwaysVisible: false });
    const root = wrapper.find('.floating-popout');
    const bar = wrapper.find('.floating-media-bar');

    await root.trigger('mouseenter');
    expect(bar.classes()).not.toContain('floating-media-bar--collapsed');

    await root.trigger('mouseleave');
    expect(bar.classes()).toContain('floating-media-bar--collapsed');
  });

  it('never collapses the bar when always visible', async () => {
    const wrapper = mountComponent({ barAlwaysVisible: true });
    const root = wrapper.find('.floating-popout');
    await root.trigger('mouseleave');
    expect(wrapper.find('.floating-media-bar').classes()).not.toContain(
      'floating-media-bar--collapsed',
    );
  });

  it.each([
    { selector: '.floating-media-bar__minimize', event: 'minimize' },
    { selector: '.floating-media-bar__close', event: 'close' },
    {
      selector: '.floating-media-bar__playlist-toggle',
      event: 'togglePlaylist',
    },
  ])('forwards $event from the bar', async ({ selector, event }) => {
    const wrapper = mountComponent();
    await wrapper.find(selector).trigger('click');
    expect(wrapper.emitted(event)).toBeTruthy();
  });

  it('forwards drag from the bar', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar').trigger('pointerdown');
    expect(wrapper.emitted('drag')).toBeTruthy();
  });

  it('forwards opacityInput when the opacity toggle is clicked', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.floating-media-bar__opacity-toggle').trigger('click');
    expect(wrapper.emitted('opacityInput')).toEqual([[66]]);
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
