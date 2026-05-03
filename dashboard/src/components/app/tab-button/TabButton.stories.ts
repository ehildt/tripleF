import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import TabButton from './TabButton.vue';

const meta = {
  title: 'App/Header/TabButton',
  component: TabButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Individual tab button with optional count badge and star indicator.',
      },
    },
  },
  argTypes: {
    activeTab: { control: 'select' },
    count: { control: 'number' },
    showStar: { control: 'boolean' },
    tint: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: {
    label: '> CHAT_',
    tab: 'http',
    activeTab: 'debug',
    count: undefined,
    showStar: false,
    tint: 0.15,
    onClick: fn(),
  },
} satisfies Meta<typeof TabButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inactive tab. */
export const Inactive: Story = {};

/** Active tab. */
export const Active: Story = {
  args: { activeTab: 'http' },
};

/** Inactive tab with count badge. */
export const WithCount: Story = {
  args: { count: 7 },
};

/** Inactive tab with notification star. */
export const WithStar: Story = {
  args: { showStar: true },
};

/** Count capped at 99+. */
export const CappedCount: Story = {
  args: { count: 150 },
};
