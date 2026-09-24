import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StatTile from './StatTile.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/StatTile',
  component: StatTile,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Mono label/value stat card: muted uppercase label over a prominent value.
Polymorphic root — \`li\` (key findings) or \`div\` with dt/dd (fundamentals).
The accent color comes from \`--stat-tile-color\` (tint).
`,
      },
    },
  },
  argTypes: {
    as: { control: 'select', options: ['li', 'div'] },
    label: { control: 'text' },
    value: { control: 'text' },
    tint: { control: 'text' },
  },
  args: {
    as: 'li',
    label: 'EPS growth',
    value: '+18%',
    tint: 'var(--color-harmony-2)',
  },
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Label + value with a harmony tint (key findings, fundamentals). */
export const Tinted: Story = {};

/** Value-only tile (findings without a split label). */
export const ValueOnly: Story = {
  args: { label: undefined, value: 'No data' },
};

/** Definition-list variant for the stockmarket fundamentals grid. */
export const Definition: Story = {
  args: {
    as: 'div',
    label: 'Market cap',
    value: '2.1T',
    tint: 'var(--color-accent-primary)',
  },
};
