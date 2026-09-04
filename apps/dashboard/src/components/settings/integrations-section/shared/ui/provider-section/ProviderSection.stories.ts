import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ProviderSection from './ProviderSection.vue';

const meta = {
  title: 'Settings/ProviderSection/ProviderSection',
  component: ProviderSection,
  tags: ['autodocs'],
  argTypes: {
    configured: { control: 'boolean' },
  },
  args: {
    configured: true,
    endpointMaxResults: { search: 25 },
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
  scrape: { enabled: true },
};

const descriptions = {
  web: 'Google search results, knowledge graph',
  images: 'Image results with dimensions',
  news: 'News articles with source and date',
  places: 'Local businesses, rating, address',
  shopping: 'Products with price and seller',
  reviews: 'Place reviews and ratings',
  videos: 'Video results from YouTube and more',
  scrape: 'Full page content scraping',
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

/** Endpoints excluded from the plan are locked off. */
export const UnavailableEndpoints: Story = {
  args: {
    config: serperConfig,
    descriptions,
    endpointAvailability: {
      web: true,
      images: true,
      news: true,
      places: false,
      shopping: false,
      reviews: false,
      videos: true,
      scrape: true,
    },
  },
};

/** Provider with an API key field and actions in the top row. */
export const WithPrepend: Story = {
  args: {
    config: serperConfig,
    descriptions,
  },
  render: (args) => ({
    components: { ProviderSection },
    setup: () => ({ args }),
    template: `
      <ProviderSection v-bind="args">
        <template #apiKey>
          <div class="story-field">API key</div>
        </template>
        <template #actions>
          <div class="story-field">Reset</div>
          <div class="story-field">Enabled</div>
        </template>
      </ProviderSection>
    `,
  }),
};
