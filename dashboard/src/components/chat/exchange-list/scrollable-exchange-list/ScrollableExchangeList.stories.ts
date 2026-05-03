import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import type { Exchange } from '@/stores/conversation';

import ScrollableExchangeList from './ScrollableExchangeList.vue';

const sampleExchanges: Exchange[] = [
  {
    id: 'u1',
    role: 'user',
    content: 'Hello there',
    status: 'done',
    timestamp: Date.now(),
  },
  {
    id: 'a1',
    role: 'assistant',
    content: '<p>Hi! How can I help?</p>',
    status: 'done',
    timestamp: Date.now(),
    requestId: 'r1',
  },
  {
    id: 'u2',
    role: 'user',
    content: 'Tell me a joke',
    status: 'done',
    timestamp: Date.now(),
    requestId: 'r2',
    included: false,
  },
];

const meta = {
  title: 'Chat/ExchangeList/ScrollableExchangeList/ScrollableExchangeList',
  component: ScrollableExchangeList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The scrollable panel that renders the exchange list. Falls back to the
ExchangeEmptyState when there are no exchanges yet. Emits
setScrollContainer so the parent can hold the ref and call
scrollToExchange from outside.
`,
      },
    },
  },
  args: {
    exchanges: sampleExchanges,
    highlightedIds: new Set<string>(),
    collapsedIds: new Set<string>(),
    onScroll: fn(),
    onSetScrollContainer: fn(),
    onDelete: fn(),
    onRetry: fn(),
    onBranch: fn(),
    onHoverDeleteStart: fn(),
    onHoverDeleteEnd: fn(),
  },
} satisfies Meta<typeof ScrollableExchangeList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default with a few exchanges. */
export const WithExchanges: Story = {};

/** Empty list — falls back to the empty-state placeholder. */
export const Empty: Story = {
  args: { exchanges: [] },
};

/** Collapsed exchange pair (user included=false plus its assistant partner). */
export const WithCollapsed: Story = {
  args: {
    exchanges: [sampleExchanges[0], sampleExchanges[1]],
    collapsedIds: new Set(['u1', 'a1']),
  },
};
