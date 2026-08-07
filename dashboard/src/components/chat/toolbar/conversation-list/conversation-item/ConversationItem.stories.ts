import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ConversationItem from './ConversationItem.vue';

const sampleSession = {
  id: 'conversation-1',
  title: 'My Conversation',
  exchanges: [],
  files: [],
  savedFileInfos: [],
  model: 'llama3',
  numCtx: '4096',
  think: 'medium',
  event: 'harness',
  roomId: 'room1',
  stream: true,
  subscriptions: [],
  type: 'temporary' as const,
  createdAt: Date.now() - 100000,
  updatedAt: Date.now() - 50000,
};

const meta = {
  title: 'Chat/Toolbar/ConversationList/ConversationItem/ConversationItem',
  component: ConversationItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single conversation row in the toolbar conversation list. Shows the conversation title,
context usage percentage, and a row of meta icons (socket binding, room, type) above the
title — each icon reveals its value in a tooltip instead of inline text.
`,
      },
    },
  },
  argTypes: {
    contextUsagePercent: { control: 'text' },
    expiresLabel: { control: 'text' },
  },
  args: {
    conversation: sampleSession,
    isActive: true,
    contextUsagePercent: '42%',
    expiresLabel: 'in 6 days',
    onSelect: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof ConversationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Active conversation with socket binding. */
export const Active: Story = {};

/** Inactive (non-selected) conversation. */
export const Inactive: Story = {
  args: { isActive: false },
};

/** Persistent conversation. */
export const Persistent: Story = {
  args: {
    conversation: { ...sampleSession, type: 'persistent' },
  },
};

/** Conversation with high context usage. */
export const HighContext: Story = {
  args: { contextUsagePercent: '95%' },
};
