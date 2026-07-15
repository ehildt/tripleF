import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ExchangeEmptyStateCanvas from './ExchangeEmptyStateCanvas.vue';

const meta = {
  title: 'Chat/ExchangeList/ExchangeEmptyState/ExchangeEmptyStateCanvas',
  component: ExchangeEmptyStateCanvas,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Animated canvas background for the chat empty state. Dots wander across the
canvas, bouncing off the edges, and fade connecting lines in and out whenever
they move close enough to form polygon silhouettes.
`,
      },
    },
  },
} satisfies Meta<typeof ExchangeEmptyStateCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default wandering-dot constellation animation. */
export const Default: Story = {};
