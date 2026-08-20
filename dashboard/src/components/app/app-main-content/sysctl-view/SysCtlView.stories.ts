import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SysCtlView from './SysCtlView.vue';

const meta = {
  title: 'App/MainContent/SysCtlView',
  component: SysCtlView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Sysctl view wrapper.',
      },
    },
  },
} satisfies Meta<typeof SysCtlView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default sysctl view. */
export const Default: Story = {};
