import type { Meta, StoryObj } from '@storybook/vue3-vite';

import LexiconSpace from './LexiconSpace.vue';

const meta = {
  title: 'Sysctl/MemorySection/LexiconSpace',
  component: LexiconSpace,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The lexicon constellation: the shared knowledge cache (verbatim chunks of
fetched web content), clustered by source domain. Without a running memory
app the fetch fails and the panel shows the unavailable note.`,
      },
    },
  },
} satisfies Meta<typeof LexiconSpace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fetches on mount — shows the unavailable note without a memory app. */
export const Default: Story = {};
