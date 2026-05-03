import { CircleAlert } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import DlqFilterMenu from './DlqFilterMenu.vue';

const meta = {
  title: 'Dlq/ListHeader/FilterMenu/DlqFilterMenu',
  component: DlqFilterMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A small popover menu used by the DLQ list header for the status, queue,
and search filters. Renders an option list by default, or a single text
input when \`hasTextValue\` is true.
`,
      },
    },
  },
  args: {
    isOpen: true,
    isActive: false,
    icon: CircleAlert,
    title: 'Status',
    width: '8rem',
    options: ['Failed', 'Active', 'Cleared', 'Removed'],
    selectedValue: '',
    hasTextValue: false,
    onToggle: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof DlqFilterMenu>;

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

/** Search input mode. */
export const SearchMode: Story = {
  args: {
    hasTextValue: true,
    title: 'Search',
    options: [],
    selectedValue: 'req-',
  },
};
