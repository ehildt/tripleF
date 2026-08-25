import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MemoryConfigPanel from './MemoryConfigPanel.vue';

const meta = {
  title: 'Sysctl/MemorySection/MemoryConfigPanel',
  component: MemoryConfigPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The Memory tab's configuration sub-section: the memory identity keys
(partition + cognition space) and the memory system variables (cognition
cap + episode-probe recency blend).`,
      },
    },
  },
} satisfies Meta<typeof MemoryConfigPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The memory configuration fields. */
export const Default: Story = {};
