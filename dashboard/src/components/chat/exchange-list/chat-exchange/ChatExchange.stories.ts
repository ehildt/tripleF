import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ChatExchange from './ChatExchange.vue';

const sampleUserExchange = {
  id: 'user-1',
  role: 'user' as const,
  status: 'done' as const,
  content: 'Hello, can you help me with something?',
  included: true,
  timestamp: Date.now(),
};

const sampleAssistantExchange = {
  id: 'asst-1',
  role: 'assistant' as const,
  status: 'done' as const,
  content: 'Of course! What would you like help with?',
  included: true,
  timestamp: Date.now(),
};

const samplePendingExchange = {
  id: 'asst-2',
  role: 'assistant' as const,
  status: 'pending' as const,
  content: '',
  included: true,
  timestamp: Date.now(),
};

const sampleStreamingExchange = {
  id: 'asst-3',
  role: 'assistant' as const,
  status: 'streaming' as const,
  content: 'Let me think about that',
  included: true,
  timestamp: Date.now(),
};

const meta = {
  title: 'Chat/ExchangeList/ChatExchange/ChatExchange',
  component: ChatExchange,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single exchange in the chat — either a user message or an assistant
response. Orchestrates the ExchangeHeader, ExchangeContent /
ExchangeCollapsed, and the ExchangeLightbox modal.
`,
      },
    },
  },
  argTypes: {
    highlighted: { control: 'boolean' },
    collapsed: { control: 'boolean' },
  },
  args: {
    exchange: sampleUserExchange,
    highlighted: false,
    collapsed: false,
    onDelete: fn(),
    onRetry: fn(),
    onBranch: fn(),
  },
} satisfies Meta<typeof ChatExchange>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A completed user message. */
export const UserMessage: Story = {};

/** A completed assistant response. */
export const AssistantMessage: Story = {
  args: { exchange: sampleAssistantExchange },
};

/** Pending assistant with animated dots. */
export const AssistantPending: Story = {
  args: { exchange: samplePendingExchange },
};

/** Streaming assistant with cursor. */
export const AssistantStreaming: Story = {
  args: { exchange: sampleStreamingExchange },
};

/** Assistant in error state. */
export const AssistantError: Story = {
  args: {
    exchange: {
      ...sampleAssistantExchange,
      status: 'error' as const,
      content: 'Something went wrong',
    },
  },
};

/** Highlighted (e.g., about to be deleted). */
export const Highlighted: Story = {
  args: { exchange: sampleUserExchange, highlighted: true },
};

/** Collapsed — user has toggled context inclusion off. */
export const Collapsed: Story = {
  args: { exchange: sampleUserExchange, collapsed: true },
};
