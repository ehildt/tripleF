import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ChatExchangeList from './ChatExchangeList.vue';

const meta = {
  title: 'Chat/ExchangeList/ChatExchangeList',
  component: ChatExchangeList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Orchestrator for the exchange list. Manages branching, deletion,
auto-scroll, hover-delete highlighting, and context-inclusion collapsing
for a chat conversation's exchanges.
`,
      },
    },
  },
  args: {
    compact: false,
    retryHandler: fn(async () => undefined),
  },
} satisfies Meta<typeof ChatExchangeList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state when no conversation has been created. */
export const Empty: Story = {};

/** Compact mode used inside the main chat layout. */
export const Compact: Story = {
  args: { compact: true },
};
