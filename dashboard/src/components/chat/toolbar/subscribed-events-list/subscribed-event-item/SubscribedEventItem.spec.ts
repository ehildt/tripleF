import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SubscribedEventItem from './SubscribedEventItem.vue';

const base = {
  event: 'harness',
  roomId: 'room1',
  active: true,
  stream: true,
};

describe('SubscribedEventItem', () => {
  it('renders a single-line card with conversation affordances', () => {
    const wrapper = mount(SubscribedEventItem, {
      props: { subscription: base, conversationNames: ['Code Review'] },
    });
    expect(wrapper.find('.subscribed-event-item__event-name').text()).toBe(
      'harness',
    );
    expect(wrapper.find('.subscribed-event-item__icons').exists()).toBe(true);
  });

  it('wraps every cluster icon in a tooltip', () => {
    const wrapper = mount(SubscribedEventItem, {
      props: {
        subscription: base,
        conversationNames: ['Code Review'],
      },
    });
    const tooltips = wrapper.findAll('.subscribed-event-item__icons .tooltip');
    // radio, stream, linked conversations, room, remove
    expect(tooltips).toHaveLength(5);
    // every tooltip wraps exactly one icon (svg or button > svg)
    for (const t of tooltips) {
      expect(t.find('svg').exists()).toBe(true);
    }
  });

  it('hides room and conversation icons when absent', () => {
    const wrapper = mount(SubscribedEventItem, {
      props: {
        subscription: { ...base, roomId: '' },
        conversationNames: [],
      },
    });
    expect(
      wrapper.findAll('.subscribed-event-item__icons .tooltip'),
    ).toHaveLength(3); // radio, stream, remove
  });

  it('uses a consistent icon size', () => {
    const wrapper = mount(SubscribedEventItem, {
      props: { subscription: base, conversationNames: ['Code Review'] },
    });
    const icons = wrapper.findAll('.subscribed-event-item__icons svg');
    for (const icon of icons) {
      expect(icon.classes()).toContain('subscribed-event-item__icon');
    }
    expect(icons.length).toBeGreaterThan(0);
  });

  it('marks the active radio with the accent tint', () => {
    const wrapper = mount(SubscribedEventItem, {
      props: { subscription: base, conversationNames: [] },
    });
    expect(
      wrapper.find('.subscribed-event-item__radio-toggle--active').exists(),
    ).toBe(true);
  });

  it('emits its toggle actions from the per-icon buttons', async () => {
    const cases = [
      ['.subscribed-event-item__remove', 'remove'],
      ['.subscribed-event-item__stream-toggle', 'toggleStream'],
      ['.subscribed-event-item__radio-toggle', 'toggleActive'],
    ] as const;
    for (const [selector, event] of cases) {
      const wrapper = mount(SubscribedEventItem, {
        props: { subscription: base, conversationNames: [] },
      });
      await wrapper.find(selector).trigger('click');
      expect(wrapper.emitted(event)).toHaveLength(1);
    }
  });
});
