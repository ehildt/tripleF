import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import EodhdSection from './EodhdSection.vue';

const meta = {
  title: 'Sysctl/SearchEnginesSection/EodhdSection',
  component: EodhdSection,
  tags: ['autodocs'],
  args: {
    updateApiKey: fn(),
    onToggleEndpoint: fn(),
    onUpdateResults: fn(),
    onReset: fn(),
    onToggleEnabled: fn(),
  },
} satisfies Meta<typeof EodhdSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const config = {
  enabled: true,
  apiKey: 'key',
  search: { enabled: true, results: 10 },
  quote: { enabled: true, results: 10 },
  history: { enabled: true, results: 10 },
  technical: { enabled: true, results: 10 },
  news: { enabled: true, results: 10 },
  fundamentals: { enabled: true, results: 10 },
  capabilities: {
    plan: 'pro',
    dailyRateLimit: 1000,
    apiRequests: 250,
    extraLimit: 50,
    endpoints: {
      search: true,
      quote: true,
      history: true,
      technical: true,
      news: true,
      fundamentals: true,
    },
  },
};

/** Configured EODHD provider with plan, usage, and endpoint availability. */
export const Default: Story = {
  args: { config },
};

/** Provider missing an API key — endpoint toggles are disabled. */
export const NotConfigured: Story = {
  args: { config: { ...config, apiKey: undefined } },
};
