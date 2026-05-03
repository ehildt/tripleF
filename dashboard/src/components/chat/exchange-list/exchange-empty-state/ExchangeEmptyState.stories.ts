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
active but has no exchanges yet. Lists the toolbar controls to orient
the user.
`,
      },
    },
  },
} satisfies Meta<typeof ExchangeEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default empty-state when a conversation is active but has no exchanges. */
export const Default: Story = {};
