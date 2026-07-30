import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ContextUsageIndicator from './ContextUsageIndicator.vue';

const meta = {
  title: 'Chat/SessionHeader/ContextUsageIndicator',
  component: ContextUsageIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Shows a token-usage percentage, color-coded by severity: info below 50%,
warning above 50%, error above 80%.
`,
      },
    },
  },
  argTypes: {
    percent: { control: 'number' },
  },
  args: {
    percent: 42,
  },
} satisfies Meta<typeof ContextUsageIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Low usage — info color. */
export const Low: Story = {};

/** Medium usage — warning color. */
export const Medium: Story = { args: { percent: 65 } };

/** High usage — error color. */
export const High: Story = { args: { percent: 92 } };

/** Null percent — nothing rendered. */
export const Empty: Story = { args: { percent: null } };
