import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EncyclopediaSpace from './EncyclopediaSpace.vue';

const meta = {
  title: 'Memory/EncyclopediaSpace',
  component: EncyclopediaSpace,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The encyclopedia constellation: the shared knowledge cache (verbatim chunks of
fetched web content), grouped by category and topic. Without a running
memory app the fetch fails and the panel shows the unavailable note.`,
      },
    },
  },
} satisfies Meta<typeof EncyclopediaSpace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fetches on mount — shows the unavailable note without a memory app. */
export const Default: Story = {};
