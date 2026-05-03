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
          'Top navigation orchestrator: brand, tab bar, and theme selector.',
      },
    },
  },
  argTypes: {
    activeTab: { control: 'select' },
    blinkLogo: { control: 'boolean' },
    debugCount: { control: 'number' },
    dlqCount: { control: 'number' },
    showChatStar: { control: 'boolean' },
  },
  args: {
    activeTab: 'http',
    blinkLogo: false,
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

/** Header with a blinking logo. */
export const BlinkingLogo: Story = {
  args: { blinkLogo: true },
};
