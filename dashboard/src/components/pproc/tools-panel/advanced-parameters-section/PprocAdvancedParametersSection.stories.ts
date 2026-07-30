import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createPinia, setActivePinia } from 'pinia';

import PprocAdvancedParametersSection from './PprocAdvancedParametersSection.vue';

function setupPinia() {
  setActivePinia(createPinia());
}

const meta = {
  title: 'Pproc/ToolsPanel/AdvancedParametersSection',
  component: PprocAdvancedParametersSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Advanced preprocessing parameters grid. Each parameter shows a number
field and a reset checkbox. Reads and writes the preprocessing store.
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
} satisfies Meta<typeof PprocAdvancedParametersSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Enabled advanced parameters section. */
export const Enabled: Story = {};
