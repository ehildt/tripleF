import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { HealthTileViewModel } from '../types/health-tile-view-model.type';
import SystemSection from './SystemSection.vue';

const UP_TILES: HealthTileViewModel[] = [
  { key: 'disk', status: 'up', loading: false, error: false },
  { key: 'ollama', status: 'up', loading: false, error: false },
  { key: 'memory_heap', status: 'up', loading: false, error: false },
  { key: 'memory_rss', status: 'up', loading: false, error: false },
  { key: 'postgres', status: 'up', loading: false, error: false },
  { key: 'minio', status: 'up', loading: false, error: false },
];

const meta = {
  title: 'Settings/SystemSection/SystemSection',
  component: SystemSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The Settings "System" tab: health tiles on top, then the Ollama connection panel
(host + masked API key — live data, shows the error state without a server),
then the interface visibility switches.`,
      },
    },
  },
  args: { tiles: UP_TILES },
} satisfies Meta<typeof SystemSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All indicators up. */
export const Default: Story = {};

/** A failing indicator — shown as down, never hidden. */
export const WithFailedCheck: Story = {
  args: {
    tiles: UP_TILES.map((tile) =>
      tile.key === 'memory_rss'
        ? { ...tile, status: 'down', error: true }
        : tile,
    ),
  },
};

/** Indicators still loading. */
export const Loading: Story = {
  args: {
    tiles: UP_TILES.map((tile) => ({
      ...tile,
      status: 'loading',
      loading: true,
    })),
  },
};
