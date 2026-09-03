import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SysCtl from './SysCtl.vue';

const meta = {
  title: 'Sysctl/SysCtl',
  component: SysCtl,
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
} satisfies Meta<typeof SysCtl>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default live panel. */
export const Default: Story = {};
