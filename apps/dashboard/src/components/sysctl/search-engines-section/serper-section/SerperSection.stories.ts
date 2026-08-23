import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import SerperSection from './SerperSection.vue';

const meta = {
  title: 'Sysctl/SearchEnginesSection/SerperSection',
  component: SerperSection,
  tags: ['autodocs'],
  args: {
    updateApiKey: fn(),
    onToggleEndpoint: fn(),
    onUpdateResults: fn(),
    onReset: fn(),
    onToggleEnabled: fn(),
  },
} satisfies Meta<typeof SerperSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const config = {
  enabled: true,
  apiKey: 'key',
  web: { enabled: true, results: 10 },
  images: { enabled: true, results: 10 },
  news: { enabled: true, results: 10 },
  places: { enabled: false, results: 5 },
  shopping: { enabled: false, results: 5 },
  reviews: { enabled: false, results: 5 },
  videos: { enabled: false, results: 5 },
  scrape: { enabled: true },
  capabilities: { remainingCredits: 1234, rateLimit: 60 },
};

/** Configured Serper provider with all endpoints and capability rows. */
export const Default: Story = {
  args: { config },
};

/** Provider missing an API key — endpoint toggles are disabled. */
export const NotConfigured: Story = {
  args: { config: { ...config, apiKey: undefined } },
};
