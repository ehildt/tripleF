import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SearxngProviderIcon from './SearxngProviderIcon.vue';

const meta = {
  title: 'Sysctl/ProviderIcon/Searxng',
  component: SearxngProviderIcon,
  tags: ['autodocs'],
} satisfies Meta<typeof SearxngProviderIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};
