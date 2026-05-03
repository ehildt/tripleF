import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ChatConversationHeader from './ChatConversationHeader.vue';

const meta = {
  title: 'Chat/SessionHeader/ChatConversationHeader',
  component: ChatConversationHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Header bar for an active chat conversation. Shows the conversation title,
exchange count, and a context-usage progress bar.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    conversationId: { control: 'text' },
    count: { control: 'number' },
  },
  args: {
    title: 'My Chat Conversation',
    conversationId: 'conversation-1',
    count: 5,
  },
} satisfies Meta<typeof ChatConversationHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default conversation header with a title and count. */
export const Default: Story = {};

/** Conversation header with no exchanges. */
export const Empty: Story = {
  args: { count: 0 },
};

/** Long title that may need truncation. */
export const LongTitle: Story = {
  args: {
    title:
      'A very long conversation title that tests text truncation behavior in the header component',
  },
};
