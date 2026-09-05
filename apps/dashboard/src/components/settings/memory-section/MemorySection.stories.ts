import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MemorySection from './MemorySection.vue';

const meta = {
  title: 'Settings/MemorySection/MemorySection',
  component: MemorySection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The Settings "Memory" tab: the memory configuration fields (identity keys,
maintenance models, auto-triggers, sweep limits). The constellation canvases
live on the top-level Memory page.`,
      },
    },
  },
} satisfies Meta<typeof MemorySection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Renders the memory configuration panel. */
export const Default: Story = {};
