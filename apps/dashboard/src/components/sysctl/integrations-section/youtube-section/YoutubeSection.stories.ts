import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import YoutubeSection from './YoutubeSection.vue';

const meta = {
  title: 'Sysctl/IntegrationsSection/YoutubeSection',
  component: YoutubeSection,
  tags: ['autodocs'],
  args: {
    updateApiKey: fn(),
    onToggleEndpoint: fn(),
    onUpdateResults: fn(),
    onReset: fn(),
    onToggleEnabled: fn(),
  },
} satisfies Meta<typeof YoutubeSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const config = {
  enabled: true,
  apiKey: 'key',
  videos: { enabled: true, results: 10 },
};

/** Configured YouTube provider with the videos endpoint. */
export const Default: Story = {
  args: { config },
};

/** Provider missing an API key — endpoint toggles are disabled. */
export const NotConfigured: Story = {
  args: { config: { ...config, apiKey: undefined } },
};
