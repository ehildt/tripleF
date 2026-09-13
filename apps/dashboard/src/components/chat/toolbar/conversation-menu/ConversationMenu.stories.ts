import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ConversationMenu from './ConversationMenu.vue';

function renderStory() {
  return (args: any) => ({
    components: { ConversationMenu },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; justify-content: flex-end; padding: 16px; min-height: 22rem;">
        <ConversationMenu
          :is-open="args.isOpen"
          :blinking="args.blinking"
          :on-mouse-enter="args.onMouseEnter"
          :on-mouse-leave="args.onMouseLeave"
          @toggle-menu="args.onToggleMenu"
          @created="args.onCreated"
        />
      </div>
    `,
  });
}

const meta = {
  title: 'Chat/Toolbar/ConversationMenu/ConversationMenu',
  component: ConversationMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Dropdown form for creating a new conversation. Provides a name input, a
context size selector, socket and room combo boxes, and temporary/persistent
creation buttons. Reads its data from the conversation/models/socket stores
via a co-located composable rather than props.
`,
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean' },
  },
  args: {
    isOpen: false,
    blinking: { value: false },
    onToggleMenu: fn(),
    onCreated: fn(),
  },
  render: renderStory(),
} satisfies Meta<typeof ConversationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed — just the icon button. */
export const Closed: Story = {};

/** Open — the creation form. */
export const Open: Story = { args: { isOpen: true } };
