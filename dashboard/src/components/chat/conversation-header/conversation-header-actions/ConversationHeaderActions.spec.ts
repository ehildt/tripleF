import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ConversationHeaderActions from './ConversationHeaderActions.vue';

describe('ConversationHeaderActions', () => {
  function mountComponent(props: {
    conversationType?: 'temporary' | 'persistent';
  }) {
    return mount(ConversationHeaderActions, {
      props: {
        conversationType: 'temporary',
        ...props,
      },
    });
  }

  it('renders three action buttons', () => {
    const wrapper = mountComponent({});
    expect(wrapper.findAll('button')).toHaveLength(3);
  });

  it.each([
    ['Rename', 'rename'],
    ['Delete conversation', 'delete'],
    ['Pin to persistent', 'toggleType'],
  ])('emits %s when the %s button is clicked', async (title, eventName) => {
    const wrapper = mountComponent({});
    await wrapper.find(`[aria-label="${title}"]`).trigger('click');
    expect(wrapper.emitted(eventName)).toBeTruthy();
  });
});
