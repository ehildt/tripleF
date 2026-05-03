import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import TabBar from './TabBar.vue';

const meta = {
  title: 'App/Header/TabBar',
  component: TabBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Horizontal tab bar for switching app sections.',
      },
    },
  },
  argTypes: {
    activeTab: { control: 'select' },
  },
  args: {
    tabs: [
      { label: '> CHAT_', tab: 'http', tint: 0.15 },
      { label: '> PPROC_', tab: 'preprocessing', tint: 0.35 },
      { label: '> DLQ_', tab: 'dlq', tint: 0.55, count: 2 },
      { label: '> DEBUG_', tab: 'debug', tint: 0.75, count: 5 },
      { label: '> SYSCTL_', tab: 'sysctl', tint: 1 },
    ],
    activeTab: 'http',
    onTabChange: fn(),
  },
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Chat tab active. */
export const ChatActive: Story = {};

/** Debug tab active with counters still visible on siblings. */
export const DebugActive: Story = {
  args: { activeTab: 'debug' },
};
