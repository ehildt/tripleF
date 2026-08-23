import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import SubscribedEventItem from './SubscribedEventItem.vue';

const meta = {
  title:
    'Chat/Toolbar/SubscribedEventsList/SubscribedEventItem/SubscribedEventItem',
  component: SubscribedEventItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single row in the subscribed events list. Shows event name, room ID,
active/inactive toggle, stream mode, and linked conversations.
`,
      },
    },
  },
  argTypes: {
    subscription: { control: 'object' },
    conversationNames: { control: 'object' },
  },
  args: {
    subscription: {
      event: 'harness',
      roomId: 'room1',
      active: true,
      stream: true,
    },
    conversationNames: ['Code Review', 'Quick Question'],
    onToggleActive: fn(),
    onToggleStream: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof SubscribedEventItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Active subscription streaming per word. */
export const ActiveStreaming: Story = {};

/** Active subscription with full-text mode. */
export const ActiveFullText: Story = {
  args: {
    subscription: {
      event: 'harness',
      roomId: 'room1',
      active: true,
      stream: false,
    },
  },
};

/** Inactive subscription. */
export const Inactive: Story = {
  args: {
    subscription: { event: 'harness', roomId: '', active: false, stream: true },
    conversationNames: [],
  },
};

/** No linked conversations. */
export const NoSessions: Story = {
  args: {
    conversationNames: [],
  },
};
