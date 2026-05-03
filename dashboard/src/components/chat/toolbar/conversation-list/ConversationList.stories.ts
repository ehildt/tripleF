import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import type { Conversation } from '@/stores/conversation';

import ConversationList from './ConversationList.vue';

const sampleSessions: Conversation[] = [
  {
    id: 'conversation-1',
    title: 'Code Review',
    exchanges: [
      {
        id: 'ex-1',
        role: 'assistant',
        content: 'Hello',
        status: 'done',
        timestamp: Date.now(),
        promptEvalCount: 500,
        evalCount: 300,
      },
    ],
    files: [],
    savedFileInfos: [],
    model: 'llama3',

    numCtx: '4096',
    think: 'medium',
    event: 'harness',
    roomId: 'room1',
    stream: true,
    subscriptions: [],
    type: 'persistent' as const,
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 100000,
  },
  {
    id: 'conversation-2',
    title: 'Quick Question',
    exchanges: [],
    files: [],
    savedFileInfos: [],
    model: 'llama3',

    numCtx: '4096',
    think: 'medium',
    event: '',
    roomId: '',
    stream: true,
    subscriptions: [],
    type: 'temporary' as const,
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 10000,
  },
];

const meta = {
  title: 'Chat/Toolbar/ConversationList/ConversationList',
  component: ConversationList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Expandable list of conversations in the toolbar. Shows an ExpandableDivider
and a scrollable list of ConversationItem rows.
`,
      },
    },
  },
  argTypes: {
    isExpanded: { control: 'boolean' },
  },
  args: {
    conversations: sampleSessions,
    activeConversationId: 'conversation-1',
    isExpanded: true,
    onToggleExpanded: fn(),
    onSelectSession: fn(),
    onDeleteSession: fn(),
  },
} satisfies Meta<typeof ConversationList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Expanded list with conversations. */
export const Expanded: Story = {};

/** Collapsed — only the divider visible. */
export const Collapsed: Story = { args: { isExpanded: false } };

/** Empty — no conversations, nothing rendered. */
export const Empty: Story = {
  args: { conversations: [], activeConversationId: null },
};
