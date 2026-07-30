import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ConversationHeaderActions from './ConversationHeaderActions.vue';

const meta = {
  title: 'Chat/SessionHeader/ConversationHeaderActions',
  component: ConversationHeaderActions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Icon-button cluster for conversation header actions: rename, delete,
pin/unpin, compact.
`,
      },
    },
  },
  argTypes: {
    conversationType: {
      control: 'select',
      options: ['temporary', 'persistent'],
    },
    compacting: { control: 'boolean' },
  },
  args: {
    conversationType: 'temporary',
    compacting: false,
  },
} satisfies Meta<typeof ConversationHeaderActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Temporary conversation — shows PinOff. */
export const Temporary: Story = {};

/** Persistent conversation — shows Pin. */
export const Persistent: Story = { args: { conversationType: 'persistent' } };

/** Compacting state — shows spinner and disables compact. */
export const Compacting: Story = { args: { compacting: true } };
