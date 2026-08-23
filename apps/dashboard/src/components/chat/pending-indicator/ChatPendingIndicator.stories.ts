import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ChatPendingIndicator from './ChatPendingIndicator.vue';

const meta = {
  title: 'Chat/PendingIndicator/ChatPendingIndicator',
  component: ChatPendingIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Animated indicator shown while an assistant exchange is pending or
streaming. Has a default pulsing variant and an aborting variant.
`,
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'aborting'] },
  },
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof ChatPendingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default pulsing indicator. */
export const Default: Story = {};

/** Aborting state — shows a different animation. */
export const Aborting: Story = {
  args: { variant: 'aborting' },
};
