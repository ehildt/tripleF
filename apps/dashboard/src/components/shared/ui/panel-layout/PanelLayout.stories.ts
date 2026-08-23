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
        <div class="px-4 py-3 bg-secondary border-b border-divider text-xs font-mono">Header slot</div>
        <div class="p-4 text-xs font-mono text-fg-secondary">Body slot</div>
      </PanelLayout>
    `,
  }),
};
