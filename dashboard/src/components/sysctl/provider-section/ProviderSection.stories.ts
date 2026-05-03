import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ProviderSection from './ProviderSection.vue';

const meta = {
  title: 'Sysctl/ProviderSection/ProviderSection',
  component: ProviderSection,
  tags: ['autodocs'],
  argTypes: {
    providerName: { control: 'text' },
    providerDescription: { control: 'text' },
    configured: { control: 'boolean' },
  },
  args: {
    providerName: 'Serper',
    providerDescription: 'Search API',
    configured: true,
    endpointMaxResults: { search: 25 },
    onToggleMaster: fn(),
    onToggleEndpoint: fn(),
    onUpdateResults: fn(),
  },
} satisfies Meta<typeof ProviderSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const serperConfig = {
  enabled: true,
  apiKey: 'key',
  web: { enabled: true, results: 10 },
  images: { enabled: true, results: 10 },
  news: { enabled: true, results: 10 },
  places: { enabled: false, results: 5 },
  shopping: { enabled: false, results: 5 },
  reviews: { enabled: false, results: 5 },
  videos: { enabled: false, results: 5 },
  webpageFetch: { enabled: true },
};

const descriptions = {
  web: 'Google search results, knowledge graph',
  images: 'Image results with dimensions',
  news: 'News articles with source and date',
  places: 'Local businesses, rating, address',
  shopping: 'Products with price and seller',
  reviews: 'Place reviews and ratings',
  videos: 'Video results from YouTube and more',
  webpageFetch: 'Full page content scraping',
};

/** Expanded provider with all endpoints visible. */
export const Expanded: Story = {
  args: {
    config: serperConfig,
    descriptions,
  },
};

/** Provider missing an API key. */
export const NotConfigured: Story = {
  args: {
    config: { ...serperConfig, apiKey: undefined },
    descriptions,
    configured: false,
  },
};

/** Provider master toggle disabled, dimming endpoints. */
export const MasterDisabled: Story = {
  args: {
    config: { ...serperConfig, enabled: false },
    descriptions,
  },
};

/** Collapsed provider showing only the header. */
export const Collapsed: Story = {
  args: {
    config: serperConfig,
    descriptions,
  },
};
