import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SettingsView from './SettingsView.vue';

const meta = {
  title: 'App/MainContent/SettingsView',
  component: SettingsView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Settings view wrapper.',
      },
    },
  },
} satisfies Meta<typeof SettingsView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default settings view. */
export const Default: Story = {};
