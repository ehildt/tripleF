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
Search Engines configuration panel. Fetches live provider overrides, lets users
select a search engine via icon buttons, toggle providers/endpoints, control tab
visibility, and monitor system health in a separate panel below.
`,
      },
    },
  },
} satisfies Meta<typeof SysCtl>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default live panel. */
export const Default: Story = {};
