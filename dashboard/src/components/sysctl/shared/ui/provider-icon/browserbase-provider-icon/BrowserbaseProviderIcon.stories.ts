import type { Meta, StoryObj } from '@storybook/vue3-vite';

import BrowserbaseProviderIcon from './BrowserbaseProviderIcon.vue';

const meta = {
  title: 'Sysctl/ProviderIcon/Browserbase',
  component: BrowserbaseProviderIcon,
  tags: ['autodocs'],
} satisfies Meta<typeof BrowserbaseProviderIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};
