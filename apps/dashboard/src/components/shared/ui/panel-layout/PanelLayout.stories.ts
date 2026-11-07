import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PanelLayout from './PanelLayout.vue';

const meta = {
  title: 'Shared/UI/PanelLayout/PanelLayout',
  component: PanelLayout,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Outer shell for a panel: a bordered, elevated surface with a glow border.
Use as the root of any debug/dlq/system panel.
`,
      },
    },
  },
} satisfies Meta<typeof PanelLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default shell with a header and body sample. */
export const Default: Story = {
  render: () => ({
    components: { PanelLayout },
    template: `
      <PanelLayout>
        <div style="padding: var(--spacing-3) var(--spacing-4); background-color: var(--color-bg-secondary); border-bottom: 1px solid var(--color-divider); font-size: 0.75rem; line-height: 1rem; font-family: var(--font-mono);">Header slot</div>
        <div style="padding: var(--spacing-4); font-size: 0.75rem; line-height: 1rem; font-family: var(--font-mono); color: var(--color-fg-secondary);">Body slot</div>
      </PanelLayout>
    `,
  }),
};
