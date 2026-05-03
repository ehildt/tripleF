import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SerperProviderIcon from './SerperProviderIcon.vue';

const meta = {
  title: 'Sysctl/ProviderIcon/Serper',
  component: SerperProviderIcon,
  tags: ['autodocs'],
} satisfies Meta<typeof SerperProviderIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};
