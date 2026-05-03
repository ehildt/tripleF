import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ExpandableDivider from './ExpandableDivider.vue';

const meta = {
  title: 'Chat/Toolbar/Shared/UI/ExpandableDivider/ExpandableDivider',
  component: ExpandableDivider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A collapsible divider with a +/− toggle icon. Used to expand/collapse
lists like conversations or subscriptions in the toolbar.
`,
      },
    },
  },
  argTypes: {
    isExpanded: { control: 'boolean' },
  },
  args: {
    isExpanded: false,
    onToggle: fn(),
  },
} satisfies Meta<typeof ExpandableDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed state — shows a plus icon. */
export const Collapsed: Story = {};

/** Expanded state — shows a minus icon. */
export const Expanded: Story = { args: { isExpanded: true } };
