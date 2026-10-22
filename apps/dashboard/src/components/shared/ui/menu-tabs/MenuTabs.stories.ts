import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MenuTabs from './MenuTabs.vue';

const meta = {
  title: 'Shared/UI/MenuTabs/MenuTabs',
  component: MenuTabs,
  tags: ['autodocs'],
  args: {
    variant: 'section',
    items: [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
      { id: 'c', label: 'Gamma' },
    ],
    active: 'a',
  },
} satisfies Meta<typeof MenuTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default right-aligned tab strip with the first tab selected. */
export const Default: Story = {};

/** A different tab selected. */
export const SecondActive: Story = {
  args: { active: 'b' },
};
