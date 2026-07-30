import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createPinia, setActivePinia } from 'pinia';

import PprocVariantsSection from './PprocVariantsSection.vue';

function setupPinia() {
  setActivePinia(createPinia());
}

const meta = {
  title: 'Pproc/ToolsPanel/VariantsSection',
  component: PprocVariantsSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Image-variant selector for preprocessing. Shows Original, Grayscale,
Denoise, Sharpen, and CLAHE toggles. Reads and writes the preprocessing
store.
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
} satisfies Meta<typeof PprocVariantsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Enabled variants section. */
export const Enabled: Story = {};
