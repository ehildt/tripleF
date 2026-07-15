import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ExchangeHeader from './ExchangeHeader.vue';

const baseExchange = {
  id: 'ex-1',
  role: 'user' as const,
  status: 'done' as const,
  content: 'Hello',
  included: true,
  timestamp: Date.now(),
};

const meta = {
  title: 'Chat/ExchangeList/ChatExchange/ExchangeHeader/ExchangeHeader',
  component: ExchangeHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Header row of a single exchange — role icon, time, model, requestId, and the
role/status-conditional action buttons (Copy, Retry, Toggle Included, Branch,
Delete, Cancel).
`,
      },
    },
  },
  argTypes: {
    isUser: { control: 'boolean' },
    isDone: { control: 'boolean' },
    isError: { control: 'boolean' },
    isPending: { control: 'boolean' },
    isStreaming: { control: 'boolean' },
  },
  args: {
    exchange: baseExchange,
    isUser: true,
    isDone: true,
    isError: false,
    isPending: false,
    isStreaming: false,
    onCopy: fn(),
    onRetry: fn(),
    onBranch: fn(),
    onDelete: fn(),
    onToggleIncluded: fn(),
    onCancel: fn(),
    onHoverDeleteStart: fn(),
    onHoverDeleteEnd: fn(),
  },
} satisfies Meta<typeof ExchangeHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Completed user exchange — Copy, Toggle, Branch, Delete visible. */
export const UserDone: Story = {};

/** Completed assistant exchange — Copy button visible. */
export const AssistantDone: Story = {
  args: {
    exchange: { ...baseExchange, role: 'assistant', model: 'llama3' },
    isUser: false,
  },
};

/** Error assistant — Retry button visible. */
export const AssistantError: Story = {
  args: {
    exchange: { ...baseExchange, role: 'assistant' },
    isUser: false,
    isError: true,
  },
};

/** Pending user — Cancel button visible while requestId is set. */
export const UserPending: Story = {
  args: {
    isDone: false,
    isPending: true,
    exchange: { ...baseExchange, requestId: 'req-123' },
  },
};

/** User exchange excluded from context. */
export const UserExcluded: Story = {
  args: {
    exchange: { ...baseExchange, included: false },
  },
};
