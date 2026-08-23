import type { Meta, StoryObj } from '@storybook/vue3-vite';

import HealthTile from './HealthTile.vue';

const meta = {
  title: 'Widgets/HealthTile/HealthTile',
  component: HealthTile,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A health-status tile with an icon, name, and current status. Used in the
system-health section of the debug panel and the sysctl panel.
`,
      },
    },
  },
  argTypes: {
    name: { control: 'text' },
    status: { control: 'text' },
    loading: { control: 'boolean' },
    error: { control: 'boolean' },
  },
  args: {
    name: 'ollama',
    status: 'up',
    loading: false,
    error: false,
  },
} satisfies Meta<typeof HealthTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Healthy service — green border with accent color. */
export const Healthy: Story = {};

/** Unhealthy service — red border. */
export const Unhealthy: Story = {
  args: { name: 'postgres', status: 'down' },
};

/** Loading — neutral border, "..." status. */
export const Loading: Story = { args: { loading: true } };

/** Error — red border, "ERR" status. */
export const ErrorState: Story = { args: { name: 'minio', error: true } };

/** Disk icon. */
export const Disk: Story = { args: { name: 'disk', status: 'up' } };
