import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import AppHeader from './AppHeader.vue';

const meta = {
  title: 'App/Header/AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Top navigation orchestrator: tab bar on the left, theme selector on the right.',
      },
    },
  },
  argTypes: {
    activeTab: { control: 'select' },
    debugCount: { control: 'number' },
    dlqCount: { control: 'number' },
    showChatStar: { control: 'boolean' },
  },
  args: {
    activeTab: 'http',
    debugCount: 0,
    dlqCount: 0,
    showChatStar: false,
    onTabChange: fn(),
  },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default header with Chat active. */
export const ChatActive: Story = {};

/** Header showing notification stars and counters. */
export const WithNotifications: Story = {
  args: {
    activeTab: 'preprocessing',
    showChatStar: true,
    dlqCount: 12,
    debugCount: 5,
  },
};
