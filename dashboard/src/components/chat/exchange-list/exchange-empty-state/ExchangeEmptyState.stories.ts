import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ExchangeEmptyState from './ExchangeEmptyState.vue';

const meta = {
  title: 'Chat/ExchangeList/ExchangeEmptyState/ExchangeEmptyState',
  component: ExchangeEmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Empty-state placeholder shown inside the scroll area when a conversation is
active but has no exchanges yet. Displays a subtle animated constellation of
wandering dots and connecting lines behind a short usage hint.
`,
      },
    },
  },
} satisfies Meta<typeof ExchangeEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default empty-state when a conversation is active but has no exchanges. */
export const Default: Story = {};
