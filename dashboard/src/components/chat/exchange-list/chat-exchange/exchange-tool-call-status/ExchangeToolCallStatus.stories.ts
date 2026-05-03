import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ExchangeToolCallStatus from './ExchangeToolCallStatus.vue';

const meta = {
  title:
    'Chat/ExchangeList/ChatExchange/ExchangeToolCallStatus/ExchangeToolCallStatus',
  component: ExchangeToolCallStatus,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Status row for an in-flight tool call (searching, finalizing, preparing,
rendering). Hidden when no tool call is active.
`,
      },
    },
  },
  argTypes: {},
  args: {
    exchange: {
      id: 'ex-1',
      role: 'assistant',
      status: 'pending',
      content: '',
      timestamp: Date.now(),
      toolCall: {
        name: 'web_search',
        status: 'running',
        input: { query: 'climate' },
      },
    },
  },
} satisfies Meta<typeof ExchangeToolCallStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Searching with a query. */
export const Searching: Story = {};

/** Finalizing output. */
export const Compacting: Story = {
  args: {
    exchange: {
      id: 'ex-1',
      role: 'assistant',
      status: 'pending',
      content: '',
      timestamp: Date.now(),
      toolCall: { name: 'web_search', status: 'compacting' },
    },
  },
};

/** Almost ready. */
export const Preparing: Story = {
  args: {
    exchange: {
      id: 'ex-1',
      role: 'assistant',
      status: 'pending',
      content: '',
      timestamp: Date.now(),
      toolCall: { name: 'web_search', status: 'preparing' },
    },
  },
};

/** Render tool call compacting — shows Rendering… */
export const Rendering: Story = {
  args: {
    exchange: {
      id: 'ex-1',
      role: 'assistant',
      status: 'pending',
      content: '',
      timestamp: Date.now(),
      toolCall: { name: 'render', status: 'compacting' },
    },
  },
};

/** No tool call — nothing rendered. */
export const Hidden: Story = {
  args: {
    exchange: {
      id: 'ex-1',
      role: 'assistant',
      status: 'streaming',
      content: 'Hello',
      timestamp: Date.now(),
    },
  },
};
