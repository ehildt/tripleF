import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NewConversationMenu from './NewConversationMenu.vue';

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(NewConversationMenu, {
    global: { stubs: { Teleport: true } },
    props: {
      isOpen: true,
      isDisabled: false,
      newConversationName: '',
      newConversationEvent: '',
      newConversationRoomId: '',
      availableSocketEvents: [],
      availableRooms: [],
      filteredNumCtxOptions: ['4096', '8192'],
      currentNumCtx: '8192',
      defaultNumCtx: '8192',
      formatCtx: (n: number) => String(n),
      ...props,
    },
  });
}

describe('NewConversationMenu', () => {
  it('creates a temporary conversation when Enter is pressed with a name', async () => {
    const wrapper = mountMenu({ newConversationName: 'Code Review' });
    const input = wrapper.find('input[name="conversation-name"]');

    await input.trigger('keydown.enter');

    expect(wrapper.emitted('createConversation')).toEqual([['temporary']]);
  });

  it('does not create a conversation when Enter is pressed with a blank name', async () => {
    const wrapper = mountMenu({ newConversationName: '   ' });
    const input = wrapper.find('input[name="conversation-name"]');

    await input.trigger('keydown.enter');

    expect(wrapper.emitted('createConversation')).toBeUndefined();
  });
});
