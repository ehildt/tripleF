import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Settings from './Settings.vue';

const meta = {
  title: 'Settings/Settings',
  component: Settings,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Settings panel. The Integrations tab shows one tile per provider — clicking
a tile opens a slide-over drawer with its configuration (API key, endpoints,
result limits); the remaining tabs host preprocessing, layouts, widgets, chat
navigation, interface, memory, and system health.
`,
      },
    },
  },
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default live panel. */
export const Default: Story = {};
