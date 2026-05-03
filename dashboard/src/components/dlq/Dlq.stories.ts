import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';

import DlqAppGrid from '../../../.storybook/DlqAppGrid.vue';
import Dlq from './Dlq.vue';

const meta = {
  title: 'Dlq/Dlq',
  component: Dlq,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Main orchestrator for the DLQ group. Wires the list header, the list
body, and the details body together. Owns the DLQ query, the
retry/delete/update mutations, the loading state, the
filter-to-store binding, and the selected-entry → details body binding.
`,
      },
    },
  },
  args: {
    models: ['llama3', 'mistral'],
  },
  decorators: [(story) => () => h(DlqAppGrid, null, () => h(story()))],
} satisfies Meta<typeof Dlq>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — empty DLQ. */
export const Default: Story = {};
