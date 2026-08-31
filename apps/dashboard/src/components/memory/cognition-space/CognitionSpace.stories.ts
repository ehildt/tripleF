import type { Meta, StoryObj } from '@storybook/vue3-vite';

import CognitionSpace from './CognitionSpace.vue';

const meta = {
  title: 'Memory/CognitionSpace',
  component: CognitionSpace,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The cognition constellation: the AI's understanding of the user — the
profile hub plus path-grouped insights. Without a running memory app the
fetch fails and the panel shows the unavailable note.`,
      },
    },
  },
} satisfies Meta<typeof CognitionSpace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fetches on mount — shows the unavailable note without a memory app. */
export const Default: Story = {};
