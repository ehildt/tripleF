import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import TabMenu from './TabMenu.vue';

const meta = {
  title: 'App/TabMenu/TabMenu',
  component: TabMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Slide-out tab menu docked to a screen edge: the app tabs up top, the theme selector pinned to the bottom. The edge handle toggles the drawer; with autoclose on (Settings → Widgets) it also closes after a tab pick or an outside click.',
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
} satisfies Meta<typeof TabMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default slide-out menu with Chat active, docked right, open. */
export const ChatActive: Story = {};

/** Menu showing notification stars and counters. */
export const WithNotifications: Story = {
  args: {
    activeTab: 'settings',
    showChatStar: true,
    dlqCount: 12,
    debugCount: 5,
  },
};
