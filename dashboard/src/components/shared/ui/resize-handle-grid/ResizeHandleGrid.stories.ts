import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ResizeHandleGrid from './ResizeHandleGrid.vue';

const meta = {
  title: 'Shared/UI/ResizeHandleGrid',
  component: ResizeHandleGrid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Invisible eight-direction resize handles for fixed-position floating
surfaces. Parent captures the pointerdown event and drives geometry
updates.
`,
      },
    },
  },
  args: {
    onResize: fn(),
  },
} satisfies Meta<typeof ResizeHandleGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All eight handles rendered around a tinted box. */
export const Default: Story = {
  render: (args) => ({
    components: { ResizeHandleGrid },
    setup() {
      return { args };
    },
    template: `
      <div style="position: relative; width: 16rem; height: 9rem; background: var(--color-bg-tertiary); border: 1px solid var(--color-divider);"
      >
        <ResizeHandleGrid v-bind="args" />
      </div>
    `,
  }),
};
