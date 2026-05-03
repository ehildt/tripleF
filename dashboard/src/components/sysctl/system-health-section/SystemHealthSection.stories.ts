import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SystemHealthSection from './SystemHealthSection.vue';

const meta = {
  title: 'Sysctl/SystemHealthSection/SystemHealthSection',
  component: SystemHealthSection,
  tags: ['autodocs'],
} satisfies Meta<typeof SystemHealthSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const tiles = [
  { key: 'disk', status: 'up', loading: false, error: false },
  { key: 'ollama', status: 'up', loading: false, error: false },
  { key: 'memory_heap', status: 'up', loading: false, error: false },
  { key: 'memory_rss', status: 'up', loading: false, error: false },
  { key: 'postgres', status: 'down', loading: false, error: false },
  { key: 'minio', status: 'up', loading: false, error: false },
  { key: 'searxng', status: 'ok', loading: false, error: false },
];

/** Fully expanded system health grid. */
export const Healthy: Story = { args: { tiles } };

/** Loading state with placeholder tiles. */
export const Loading: Story = {
  args: {
    tiles: tiles.map((t) => ({ ...t, status: 'loading', loading: true })),
  },
};
