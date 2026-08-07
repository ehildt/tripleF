import { CircleAlert, Search } from '@lucide/vue';
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
A small popover menu used by list headers for status, queue, and search
filters. Renders an option list by default, or a single text input when
\`hasTextValue\` is true. The trigger icon is provided through the default
slot.
`,
      },
    },
  },
  args: {
    isOpen: true,
    isActive: false,
    title: 'Status',
    width: '8rem',
    options: ['Failed', 'Active', 'Cleared', 'Removed'],
    selectedValue: '',
    hasTextValue: false,
    onToggle: fn(),
    onSelect: fn(),
  },
  render: (args) => ({
    components: { FilterMenu, CircleAlert },
    setup: () => ({ args }),
    template: `<FilterMenu v-bind="args"><CircleAlert /></FilterMenu>`,
  }),
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

/** Search input mode. */
export const SearchMode: Story = {
  args: {
    hasTextValue: true,
    title: 'Search',
    options: [],
    selectedValue: 'req-',
  },
  render: (args) => ({
    components: { FilterMenu, Search },
    setup: () => ({ args }),
    template: `<FilterMenu v-bind="args"><Search /></FilterMenu>`,
  }),
};
