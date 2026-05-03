import type { Meta, StoryObj } from '@storybook/vue3-vite';

import BraveProviderIcon from './BraveProviderIcon.vue';

const meta = {
  title: 'Sysctl/ProviderIcon/Brave',
  component: BraveProviderIcon,
  tags: ['autodocs'],
} satisfies Meta<typeof BraveProviderIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};
