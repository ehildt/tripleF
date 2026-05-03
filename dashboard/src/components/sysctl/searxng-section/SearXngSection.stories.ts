import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import SearXngSection from './SearXngSection.vue';

const meta = {
  title: 'Sysctl/SearXngSection/SearXngSection',
  component: SearXngSection,
  tags: ['autodocs'],
  argTypes: {
    config: { control: 'object' },
  },
  args: {
    config: { url: 'https://search.local', enabled: true, results: 10 },
    onToggleEnabled: fn(),
    onUpdateResults: fn(),
  },
} satisfies Meta<typeof SearXngSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Healthy SearXNG section with results input. */
export const Healthy: Story = {};

/** Unreachable SearXNG section dimmed and disabled. */
export const Unreachable: Story = {
  args: {
    config: { url: 'https://search.local', enabled: false, results: 10 },
  },
};

/** Collapsed section. */
export const Collapsed: Story = {};
