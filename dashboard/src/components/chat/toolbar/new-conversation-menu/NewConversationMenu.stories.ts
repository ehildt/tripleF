import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import NewConversationMenu from './NewConversationMenu.vue';

function renderStory() {
  return (args: any) => ({
    components: { NewConversationMenu },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; justify-content: flex-end; padding: 16px; min-height: 22rem;">
        <NewConversationMenu
          :is-open="args.isOpen"
          :is-disabled="args.isDisabled"
          :new-conversation-name="args.newConversationName"
          :new-conversation-event="args.newConversationEvent"
          :new-conversation-room-id="args.newConversationRoomId"
          :available-socket-events="args.availableSocketEvents"
          :available-rooms="args.availableRooms"
          :filtered-num-ctx-options="args.filteredNumCtxOptions"
          :current-num-ctx="args.currentNumCtx"
          :default-num-ctx="args.defaultNumCtx"
          :format-ctx="args.formatCtx"
          @toggle-menu="args.onToggleMenu"
          @update:new-conversation-name="args['onUpdate:newConversationName']"
          @update:new-conversation-event="args['onUpdate:newConversationEvent']"
          @update:new-conversation-room-id="args['onUpdate:newConversationRoomId']"
          @create-conversation="args.onCreateSession"
          @select-num-ctx="args.onSelectNumCtx"
        />
      </div>
    `,
  });
}

const meta = {
  title: 'Chat/Toolbar/NewConversationMenu/NewConversationMenu',
  component: NewConversationMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Dropdown form for creating a new conversation. Provides a name input, a
context size selector, socket and room combo boxes, and
temporary/persistent creation buttons.

Both combo boxes accept free text; when the chosen socket already has known
events (or rooms on that event), clicking the field opens an input for a new
value above a divider with the existing values below.`,
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    newConversationName: { control: 'text' },
    newConversationEvent: { control: 'text' },
    newConversationRoomId: { control: 'text' },
  },
  args: {
    isOpen: false,
    isDisabled: false,
    newConversationName: '',
    newConversationEvent: '',
    newConversationRoomId: '',
    availableSocketEvents: [],
    availableRooms: [],
    filteredNumCtxOptions: ['4096', '8192', '16384', '32768'],
    currentNumCtx: '8192',
    defaultNumCtx: '8192',
    formatCtx: (n: number) => (n >= 1024 ? `${n / 1024}k` : String(n)),
    onToggleMenu: fn(),
    'onUpdate:newConversationName': fn(),
    'onUpdate:newConversationEvent': fn(),
    'onUpdate:newConversationRoomId': fn(),
    onCreateSession: fn(),
    onSelectNumCtx: fn(),
  },
  render: renderStory(),
} satisfies Meta<typeof NewConversationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed — just the icon button. */
export const Closed: Story = {};

/** Open with no known sockets — socket and room are plain inputs. */
export const Open: Story = { args: { isOpen: true } };

/** Disabled — no model selected. */
export const Disabled: Story = { args: { isDisabled: true } };

/** With a conversation name filled in. */
export const WithName: Story = {
  args: { isOpen: true, newConversationName: 'Code Review' },
};

/** Known sockets and rooms — both fields open an option list. */
export const WithExistingSocketsAndRooms: Story = {
  args: {
    isOpen: true,
    newConversationEvent: 'harness',
    availableSocketEvents: ['harness', 'updates'],
    availableRooms: ['dev-team', 'lobby', 'release-notes'],
  },
};

/** Known sockets but no rooms on the chosen socket — room stays a plain input. */
export const WithSocketsButNoRooms: Story = {
  args: {
    isOpen: true,
    newConversationEvent: 'fresh-event',
    availableSocketEvents: ['harness', 'updates'],
    availableRooms: [],
  },
};
