import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AppThemeSelector from './AppThemeSelector.vue';

const meta = {
  title: 'App/ThemeSelector',
  component: AppThemeSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Theme switcher dropdown and dark mode toggle.',
      },
    },
  },
} satisfies Meta<typeof AppThemeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed by default. */
export const Closed: Story = {};
