import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import TabVisibilitySection from './TabVisibilitySection.vue';

const meta = {
  title: 'Sysctl/TabVisibilitySection/TabVisibilitySection',
  component: TabVisibilitySection,
  tags: ['autodocs'],
  argTypes: {
    isSocketsVisible: { control: 'boolean' },
    showCounters: { control: 'boolean' },
  },
  args: {
    isSocketsVisible: true,
    showCounters: true,
    onToggleSockets: fn(),
    onToggleCounters: fn(),
  },
} satisfies Meta<typeof TabVisibilitySection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sockets visible and counters enabled. */
export const AllVisible: Story = {};

/** Sockets toolbar menu hidden. */
export const SocketsHidden: Story = {
  args: { isSocketsVisible: false },
};

/** Counters turned off. */
export const CountersOff: Story = {
  args: { showCounters: false },
};
