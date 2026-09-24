import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ChartRow from './ChartRow.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/ChartRow',
  component: ChartRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Layout row for a chart: a padded, bordered box that fills the full width
of the response. The chart content goes in the default slot.
`,
      },
    },
  },
  render: () => ({
    components: { ChartRow },
    template: `
      <ChartRow>
        <div
          style="height: 16rem; background-color: var(--color-bg-tertiary); border: 1px solid var(--color-divider);"
        >
          Chart area
        </div>
      </ChartRow>
    `,
  }),
} satisfies Meta<typeof ChartRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
