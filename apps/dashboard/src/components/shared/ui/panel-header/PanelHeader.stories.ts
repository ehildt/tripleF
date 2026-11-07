import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PanelHeader from './PanelHeader.vue';

const meta = {
  title: 'Shared/UI/PanelHeader/PanelHeader',
  component: PanelHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Bordered header row of a panel. Default slot accepts a title and an
actions row, justified to opposite ends.
`,
      },
    },
  },
} satisfies Meta<typeof PanelHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Header with a title and an action button. */
export const Default: Story = {
  render: () => ({
    components: { PanelHeader },
    template: `
      <PanelHeader>
        <span style="font-size: 0.75rem; line-height: 1rem; font-family: var(--font-mono);">Section title</span>
        <button style="font-size: 0.75rem; line-height: 1rem; font-family: var(--font-mono);">Action</button>
      </PanelHeader>
    `,
  }),
};
