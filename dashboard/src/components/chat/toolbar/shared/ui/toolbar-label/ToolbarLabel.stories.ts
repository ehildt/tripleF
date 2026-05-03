import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ToolbarLabel from './ToolbarLabel.vue';

const meta = {
  title: 'Chat/Toolbar/Shared/UI/ToolbarLabel/ToolbarLabel',
  component: ToolbarLabel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Small monospace label shown next to a toolbar IconButton.

Displays either the current selected value (e.g. model name) or a static section label
(e.g. conversations, sockets). The \`active\` prop flips the color to accent for availability hints.
`,
      },
    },
  },
  argTypes: {
    value: { control: 'text' },
    active: { control: 'boolean' },
  },
  args: {
    value: 'label',
    active: false,
  },
} satisfies Meta<typeof ToolbarLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state — secondary foreground color. */
export const Default: Story = {};

/** Active (highlight) — accent color for availability warnings or emphasis. */
export const Active: Story = {
  args: { active: true },
};

/** Long value — truncates with ellipsis when exceeding available width. */
export const TruncatedValue: Story = {
  args: {
    value: 'very-long-model-name-that-should-truncate-gracefully-with-ellipsis',
  },
};
