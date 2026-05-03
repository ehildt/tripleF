import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PanelHeaderTitle from './PanelHeaderTitle.vue';

const meta = {
  title: 'Shared/UI/PanelHeaderTitle/PanelHeaderTitle',
  component: PanelHeaderTitle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Uppercase monospaced title with a chevron prefix, used in the leading
slot of PanelHeader.
`,
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
  },
  args: {
    label: 'Section',
  },
} satisfies Meta<typeof PanelHeaderTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default uppercase section title. */
export const Default: Story = {};

/** Long label demonstrates the uppercase tracking. */
export const LongLabel: Story = { args: { label: 'Request Details' } };
