import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import TabVisibilitySection from './TabVisibilitySection.vue';

const meta = {
  title: 'Sysctl/TabVisibilitySection/TabVisibilitySection',
  component: TabVisibilitySection,
  tags: ['autodocs'],
  argTypes: {
    isDebugVisible: { control: 'boolean' },
    isDlqVisible: { control: 'boolean' },
    showCounters: { control: 'boolean' },
  },
  args: {
    isDebugVisible: true,
    isDlqVisible: true,
    showCounters: true,
    onToggleDebug: fn(),
    onToggleDlq: fn(),
    onToggleCounters: fn(),
  },
} satisfies Meta<typeof TabVisibilitySection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All tabs visible and counters enabled. */
export const AllVisible: Story = {};

/** Debug tab hidden. */
export const DebugHidden: Story = {
  args: { isDebugVisible: false },
};

/** Counters turned off. */
export const CountersOff: Story = {
  args: { showCounters: false },
};
