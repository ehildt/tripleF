import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createPinia, setActivePinia } from 'pinia';

import PprocResizeSection from './PprocResizeSection.vue';

function setupPinia() {
  setActivePinia(createPinia());
}

const meta = {
  title: 'Pproc/ToolsPanel/ResizeSection',
  component: PprocResizeSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Resize settings for image preprocessing: max width, max height, and
prevent-upscaling toggle. Reads and writes the preprocessing store.
`,
      },
    },
  },
  decorators: [
    () => {
      setupPinia();
      return { template: '<story />' };
    },
  ],
} satisfies Meta<typeof PprocResizeSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Enabled resize section. */
export const Enabled: Story = {};
