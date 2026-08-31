import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PartitionSpace from './PartitionSpace.vue';

const meta = {
  title: 'Memory/PartitionSpace',
  component: PartitionSpace,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The partition constellation: the user's stored fact records, grouped by
topic tag. Without a running memory app the fetch fails and the panel shows
the unavailable note.`,
      },
    },
  },
} satisfies Meta<typeof PartitionSpace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fetches on mount — shows the unavailable note without a memory app. */
export const Default: Story = {};
