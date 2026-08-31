import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Memory from './Memory.vue';

const meta = {
  title: 'Memory/Memory',
  component: Memory,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The top-level Memory page: one constellation canvas per memory layer —
partition facts, cognition insights, and the shared encyclopedia — with a
submenu to switch spaces (default: encyclopedia). Configuration lives in
SysCtl's Memory tab.`,
      },
    },
  },
} satisfies Meta<typeof Memory>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — opens on the encyclopedia canvas. */
export const Default: Story = {};
