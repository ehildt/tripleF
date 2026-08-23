import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import BrightDataSection from './BrightDataSection.vue';

const meta = {
  title: 'Sysctl/SearchEnginesSection/BrightDataSection',
  component: BrightDataSection,
  tags: ['autodocs'],
  args: {
    updateApiKey: fn(),
    onToggleEndpoint: fn(),
    onUpdateResults: fn(),
    onReset: fn(),
    onToggleEnabled: fn(),
    onZoneChange: fn(),
  },
} satisfies Meta<typeof BrightDataSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const config = {
  enabled: true,
  apiKey: 'key',
  serpZone: 'serp_api',
  unlockerZone: 'unlocker',
  web: { enabled: true, results: 10 },
  images: { enabled: true, results: 10 },
  news: { enabled: true, results: 10 },
  places: { enabled: false, results: 5 },
  shopping: { enabled: false, results: 5 },
  videos: { enabled: false, results: 5 },
  scrape: { enabled: true },
  capabilities: { status: 'active', balance: 12.5, pendingCosts: 0.25 },
};

/** Configured Bright Data provider with zones and capability rows. */
export const Default: Story = {
  args: { config },
};

/** Provider missing an API key — endpoint toggles are disabled. */
export const NotConfigured: Story = {
  args: { config: { ...config, apiKey: undefined } },
};
