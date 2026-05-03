import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ExchangeContent from './ExchangeContent.vue';

const baseAssistantExchange = {
  id: 'ex-1',
  role: 'assistant' as const,
  status: 'done' as const,
  content: 'Hello there',
  timestamp: Date.now(),
};

const baseUserExchange = {
  id: 'ex-2',
  role: 'user' as const,
  status: 'done' as const,
  content: 'What is the weather today?',
  timestamp: Date.now(),
};

const meta = {
  title: 'Chat/ExchangeList/ChatExchange/ExchangeContent/ExchangeContent',
  component: ExchangeContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `The body of a single exchange: the role-colored divider, the content
container (compacting/streaming dot indicator, assistant response templates,
or a user request), and the streaming cursor. Emits imageClicked for the
parent to handle the lightbox.`,
      },
    },
  },
  argTypes: {
    isUser: { control: 'boolean' },
    isError: { control: 'boolean' },
    isPending: { control: 'boolean' },
    isStreaming: { control: 'boolean' },
    isHighlighted: { control: 'boolean' },
    isCompacting: { control: 'boolean' },
  },
  args: {
    exchange: baseAssistantExchange,
    isUser: false,
    isError: false,
    isPending: false,
    isStreaming: false,
    isHighlighted: false,
    isCompacting: false,
    onImageClicked: fn(),
  },
} satisfies Meta<typeof ExchangeContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default assistant message with sanitized HTML body. */
export const AssistantMessage: Story = {};

/** User message — right-aligned accent divider and request component. */
export const UserMessage: Story = {
  args: {
    isUser: true,
    exchange: baseUserExchange,
  },
};

/** Error state — red divider. */
export const ErrorState: Story = {
  args: {
    isError: true,
    isUser: false,
    exchange: { ...baseAssistantExchange, status: 'error', content: 'Oops' },
  },
};

/** Pending state with three animated dots (non-compacting). */
export const PendingDots: Story = {
  args: {
    isPending: true,
    exchange: { ...baseAssistantExchange, status: 'pending', content: '' },
  },
};

/** Pending state with compacting conversation indicator. */
export const Compacting: Story = {
  args: {
    isPending: true,
    isCompacting: true,
    exchange: { ...baseAssistantExchange, status: 'pending', content: '' },
  },
};

/** Streaming state — content visible with animated cursor. */
export const Streaming: Story = {
  args: {
    isStreaming: true,
    exchange: {
      ...baseAssistantExchange,
      status: 'streaming',
      content: 'I am thinking...',
    },
  },
};

/** Highlighted — pulse + ring. */
export const Highlighted: Story = {
  args: { isHighlighted: true },
};
