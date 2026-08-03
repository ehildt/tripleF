import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ConversationHeaderActions from './ConversationHeaderActions.vue';

describe('ConversationHeaderActions', () => {
  function mountComponent(props: {
    conversationType?: 'temporary' | 'persistent';
    compacting?: boolean;
  }) {
    return mount(ConversationHeaderActions, {
      props: {
        conversationType: 'temporary',
        compacting: false,
        ...props,
      },
    });
  }

  it('renders four action buttons', () => {
    const wrapper = mountComponent({});
    expect(wrapper.findAll('button')).toHaveLength(4);
  });

  it.each([
    ['Rename', 'rename'],
    ['Delete conversation', 'delete'],
    ['Pin to persistent', 'toggleType'],
    ['Compact', 'compact'],
  ])('emits %s when the %s button is clicked', async (title, eventName) => {
    const wrapper = mountComponent({});
    await wrapper.find(`[title="${title}"]`).trigger('click');
    expect(wrapper.emitted(eventName)).toBeTruthy();
  });

  it('disables compact button while compacting', () => {
    const wrapper = mountComponent({ compacting: true });
    const compactButton = wrapper.find('[title="Compacting..."]');
    expect(compactButton.attributes('disabled')).toBeDefined();
  });
});
