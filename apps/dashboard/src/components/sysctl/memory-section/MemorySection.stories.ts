import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MemorySection from './MemorySection.vue';

const meta = {
  title: 'Sysctl/MemorySection/MemorySection',
  component: MemorySection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The SysCtl "Memory" tab: a submenu of four sub-sections — configuration
fields, then one constellation canvas per memory layer (partition facts,
cognition insights, shared lexicon chunks).`,
      },
    },
  },
} satisfies Meta<typeof MemorySection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opens on the configuration sub-section. */
export const Default: Story = {};
