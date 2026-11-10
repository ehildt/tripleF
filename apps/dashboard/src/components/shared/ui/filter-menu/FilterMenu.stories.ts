import { ListFilter } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import FilterMenu from './FilterMenu.vue';

const meta = {
  title: 'Shared/UI/FilterMenu/FilterMenu',
  component: FilterMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A small options popover used by list headers for status filters. The
trigger renders a lucide icon from the \`icon\` prop and teleports the
option list with a transparent outside-click backdrop.
`,
      },
    },
  },
  argTypes: {
    icon: { control: false },
  },
  args: {
    isOpen: true,
    isActive: false,
    title: 'Status',
    width: '8rem',
    icon: ListFilter,
    options: [
      { value: 'Failed', label: 'Failed' },
      { value: 'Active', label: 'Active' },
      { value: 'Cleared', label: 'Cleared' },
      { value: 'Removed', label: 'Removed' },
    ],
    selectedValue: '',
    onToggle: fn(),
    onClose: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof FilterMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Open with options, none selected. */
export const Open: Story = {};

/** Open with one option highlighted. */
export const WithSelection: Story = { args: { selectedValue: 'Active' } };

/** Trigger shows the active tint when a value is set but the menu is closed. */
export const ActiveTrigger: Story = {
  args: { isOpen: false, selectedValue: 'Active' },
};
