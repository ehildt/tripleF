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
      <div style="display: flex; justify-content: flex-end; padding: 16px;">
        <NewConversationMenu
          :is-open="args.isOpen"
          :is-disabled="args.isDisabled"
          :new-conversation-name="args.newConversationName"
          :new-conversation-socket-binding="args.newConversationSocketBinding"
          :available-socket-bindings="args.availableSocketBindings"
          :filtered-num-ctx-options="args.filteredNumCtxOptions"
          :current-num-ctx="args.currentNumCtx"
          :default-num-ctx="args.defaultNumCtx"
          :format-ctx="args.formatCtx"
          @toggle-menu="args.onToggleMenu"
          @update:new-conversation-name="args['onUpdate:newConversationName']"
          @update:new-conversation-socket-binding="args['onUpdate:newConversationSocketBinding']"
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
Dropdown form for creating a new conversation. Provides a name input,
context size selector, socket binding dropdown, and temporary/persistent
creation buttons.
`,
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    newConversationName: { control: 'text' },
    newConversationSocketBinding: { control: 'text' },
  },
  args: {
    isOpen: false,
    isDisabled: false,
    newConversationName: '',
    newConversationSocketBinding: '',
    availableSocketBindings: ['harness::room1', 'updates'],
    filteredNumCtxOptions: ['4096', '8192', '16384', '32768'],
    currentNumCtx: '8192',
    defaultNumCtx: '8192',
    formatCtx: (n: number) => (n >= 1024 ? `${n / 1024}k` : String(n)),
    onToggleMenu: fn(),
    'onUpdate:newConversationName': fn(),
    'onUpdate:newConversationSocketBinding': fn(),
    onCreateSession: fn(),
    onSelectNumCtx: fn(),
  },
  render: renderStory(),
} satisfies Meta<typeof NewConversationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed — just the icon button. */
export const Closed: Story = {};

/** Open — showing the creation form. */
export const Open: Story = { args: { isOpen: true } };

/** Disabled — no model selected. */
export const Disabled: Story = { args: { isDisabled: true } };

/** With a conversation name filled in. */
export const WithName: Story = {
  args: { isOpen: true, newConversationName: 'Code Review' },
};
