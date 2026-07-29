import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TabMenuPanel from './TabMenuPanel.vue';

const meta = {
  title: 'Sysctl/TabMenuPanel/TabMenuPanel',
  component: TabMenuPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tab menu settings: the screen edge the slide-out menu is docked to, whether it closes itself after a tab pick or an outside click, and which optional tabs (dlq, debug) show up in the drawer.',
      },
    },
  },
} satisfies Meta<typeof TabMenuPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default tab menu settings: docked right, toggled by hand, all tabs visible. */
export const Default: Story = {};
