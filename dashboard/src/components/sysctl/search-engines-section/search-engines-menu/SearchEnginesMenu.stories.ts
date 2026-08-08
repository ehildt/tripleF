import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import SearchEnginesMenu from './SearchEnginesMenu.vue';

const meta = {
  title: 'Sysctl/SearchEngines/SearchEnginesMenu',
  component: SearchEnginesMenu,
  tags: ['autodocs'],
  args: {
    activeEngine: 'serper',
    onSelectEngine: fn(),
  },
} satisfies Meta<typeof SearchEnginesMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state with Serper selected. */
export const Default: Story = {
  args: {
    activeEngine: 'serper',
  },
};

/** A different engine selected. */
export const EodhdSelected: Story = {
  args: {
    activeEngine: 'eodhd',
  },
};
