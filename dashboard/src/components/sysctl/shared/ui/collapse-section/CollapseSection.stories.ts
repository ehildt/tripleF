import { Search } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import CollapseSection from './CollapseSection.vue';

const meta = {
  title: 'Sysctl/Shared/UI/CollapseSection/CollapseSection',
  component: CollapseSection,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    open: { control: 'boolean' },
  },
  args: {
    icon: Search,
    title: 'Search Engines',
    open: true,
    onToggle: fn(),
  },
} satisfies Meta<typeof CollapseSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Expanded section showing its content slot. */
export const Open: Story = {
  render: (args) => ({
    components: { CollapseSection },
    setup() {
      return { args };
    },
    template:
      '<CollapseSection v-bind="args"><div class="p-4">Section content</div></CollapseSection>',
  }),
};

/** Collapsed section with only the header visible. */
export const Closed: Story = { args: { open: false } };
