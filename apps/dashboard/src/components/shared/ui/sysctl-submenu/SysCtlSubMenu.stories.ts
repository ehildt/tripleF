import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SysCtlSubMenu from './SysCtlSubMenu.vue';

const meta = {
  title: 'Shared/UI/SysCtlSubMenu/SysCtlSubMenu',
  component: SysCtlSubMenu,
  tags: ['autodocs'],
  args: {
    items: [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
      { id: 'c', label: 'Gamma' },
    ],
    active: 'a',
  },
} satisfies Meta<typeof SysCtlSubMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default right-aligned submenu with the first item active. */
export const Default: Story = {};

/** A different item selected. */
export const SecondActive: Story = {
  args: { active: 'b' },
};
