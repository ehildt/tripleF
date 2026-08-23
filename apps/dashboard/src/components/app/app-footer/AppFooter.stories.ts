import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AppFooter from './AppFooter.vue';

const meta = {
  title: 'App/Footer',
  component: AppFooter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Minimal footer: the game-style session id at the very left. Click copies it to the clipboard.',
      },
    },
  },
  argTypes: {
    socketId: { control: 'text' },
  },
  args: {
    socketId: null,
  },
} satisfies Meta<typeof AppFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No session yet — placeholder. */
export const NoSession: Story = {};

/** Connected — full session id, click to copy. */
export const Connected: Story = {
  args: {
    socketId: 'kX9f2mAbCdEfGhIjKlMn',
  },
};
