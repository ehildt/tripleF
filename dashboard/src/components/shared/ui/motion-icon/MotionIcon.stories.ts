import { BellRing } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MotionIcon from './MotionIcon.vue';

const meta = {
  title: 'Shared/MotionIcon',
  component: MotionIcon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Adds a subtle hover/press micro-interaction to an icon rendered through the default slot.',
      },
    },
  },
} satisfies Meta<typeof MotionIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A static Lucide icon in the slot. */
export const Default: Story = {
  render: (args) => ({
    components: { MotionIcon },
    setup: () => ({ args, BellRing }),
    template: '<MotionIcon><BellRing :size="20" /></MotionIcon>',
  }),
};
