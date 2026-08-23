import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import type { Exchange } from '@/stores/conversation';

import type { ExchangeSection } from '../helpers/build-exchange-sections.helper';
import ScrollableExchangeList from './ScrollableExchangeList.vue';

function exchange(
  id: string,
  role: 'user' | 'assistant',
  content: string,
): Exchange {
  return { id, role, content, status: 'done', timestamp: Date.now() };
}

const sampleSections: ExchangeSection[] = [
  {
    id: 'u1',
    user: exchange('u1', 'user', 'Hello there'),
    assistants: [exchange('a1', 'assistant', '<p>Hi! How can I help?</p>')],
  },
  {
    id: 'u2',
    user: exchange('u2', 'user', 'Tell me a joke'),
    assistants: [exchange('a2', 'assistant', '<p>Why did the…</p>')],
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
The vertical carousel that renders the exchange list as full-height
sections (each a user prompt paired with its assistant response). Scrolling
snaps between sections and crossfades (blends) between them. Falls back to
the ExchangeEmptyState when there are no sections yet.
`,
      },
    },
  },
  args: {
    sections: sampleSections,
    mode: 'carousel',
    highlightedIds: new Set<string>(),
    collapsedIds: new Set<string>(),
    isCompact: false,
    activeAssistantExchangeId: null,
    activeAssistantResponseStarted: false,
    onDelete: fn(),
    onRetry: fn(),
    onBranch: fn(),
    onToggleIncluded: fn(),
    onHoverDeleteStart: fn(),
    onHoverDeleteEnd: fn(),
  },
} satisfies Meta<typeof ScrollableExchangeList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default with a few sections. */
export const WithSections: Story = {};

/** The same sections in native continuous-scroll mode. */
export const NativeMode: Story = {
  args: { mode: 'native' },
};

/** Empty list — falls back to the empty-state placeholder. */
export const Empty: Story = {
  args: { sections: [] },
};

/** A section whose assistant response is still pending. */
export const WithPendingAssistant: Story = {
  args: {
    sections: [
      {
        id: 'u3',
        user: exchange('u3', 'user', 'What is the weather?'),
        assistants: [
          {
            id: 'a3',
            role: 'assistant',
            content: '',
            status: 'pending',
            timestamp: Date.now(),
          },
        ],
      },
    ],
  },
};
