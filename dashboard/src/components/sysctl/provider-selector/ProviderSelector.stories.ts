import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProviderSelector from './ProviderSelector.vue';

const meta = {
  title: 'Sysctl/ProviderSelector',
  component: ProviderSelector,
  tags: ['autodocs'],
} satisfies Meta<typeof ProviderSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Serper: Story = {
  args: {
    selectedProvider: 'serper',
    configuredProviders: {
      serper: true,
      brave: true,
      searxng: true,
      browserBase: true,
    },
  },
};

export const Brave: Story = {
  args: {
    selectedProvider: 'brave',
    configuredProviders: {
      serper: true,
      brave: true,
      searxng: true,
      browserBase: true,
    },
  },
};

export const Searxng: Story = {
  args: {
    selectedProvider: 'searxng',
    configuredProviders: {
      serper: true,
      brave: true,
      searxng: true,
      browserBase: true,
    },
  },
};

export const Browserbase: Story = {
  args: {
    selectedProvider: 'browserBase',
    configuredProviders: {
      serper: true,
      brave: true,
      searxng: true,
      browserBase: true,
    },
  },
};

/** Only SearXNG is available. */
export const Filtered: Story = {
  args: {
    selectedProvider: 'searxng',
    configuredProviders: {
      serper: false,
      brave: false,
      searxng: true,
      browserBase: false,
    },
  },
};
