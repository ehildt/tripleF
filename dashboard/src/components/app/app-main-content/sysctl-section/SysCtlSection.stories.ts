import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SysCtlSection from './SysCtlSection.vue';

const meta = {
  title: 'App/MainContent/SysCtlSection',
  component: SysCtlSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Sysctl section wrapper.',
      },
    },
  },
} satisfies Meta<typeof SysCtlSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default sysctl section. */
export const Default: Story = {};
