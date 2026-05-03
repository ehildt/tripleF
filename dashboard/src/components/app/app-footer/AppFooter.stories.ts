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
          'Status footer with version, connection state, and endpoint info.',
      },
    },
  },
  argTypes: {
    connectionState: { control: 'select' },
    socketId: { control: 'text' },
    connectedPairs: { control: 'object' },
  },
  args: {
    connectionState: 'disconnected',
    socketId: null,
    connectedPairs: [],
  },
} satisfies Meta<typeof AppFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Disconnected state. */
export const Disconnected: Story = {};

/** Connected with socket id and active bindings. */
export const Connected: Story = {
  args: {
    connectionState: 'connected',
    socketId: 'sock-abc-123',
    connectedPairs: ['harness', 'harness::room1'],
  },
};

/** Error state. */
export const ErrorState: Story = {
  args: { connectionState: 'error' },
};
