import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import SubscribedEventsList from './SubscribedEventsList.vue';

const sampleSubscriptions = [
  { event: 'harness', roomId: 'room1', active: true, stream: true },
  { event: 'updates', roomId: '', active: true, stream: false },
  { event: 'alerts', roomId: 'critical', active: false, stream: true },
];

const meta = {
  title: 'Chat/Toolbar/SubscribedEventsList/SubscribedEventsList',
  component: SubscribedEventsList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Expandable list of subscribed socket events. Shows an ExpandableDivider
and a scrollable list of SubscribedEventItem rows.
`,
      },
    },
  },
  argTypes: {
    isExpanded: { control: 'boolean' },
  },
  args: {
    subscriptions: sampleSubscriptions,
    isExpanded: true,
    conversationNamesByEvent: {
      'harness::room1': ['Code Review'],
      'updates::': ['Quick Question'],
    },
    onToggleExpanded: fn(),
    onToggleActive: fn(),
    onToggleStream: fn(),
    onRemoveSubscription: fn(),
  },
} satisfies Meta<typeof SubscribedEventsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Expanded list with subscriptions. */
export const Expanded: Story = {};

/** Collapsed — only the divider visible. */
export const Collapsed: Story = { args: { isExpanded: false } };

/** Empty — no subscriptions, nothing rendered. */
export const Empty: Story = {
  args: { subscriptions: [], conversationNamesByEvent: {} },
};
