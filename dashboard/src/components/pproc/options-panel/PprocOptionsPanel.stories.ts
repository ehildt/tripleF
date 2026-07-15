import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PprocOptionsPanel from './PprocOptionsPanel.vue';

const meta = {
  title: 'Pproc/OptionsPanel/PprocOptionsPanel',
  component: PprocOptionsPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Right-side options panel of the preprocessing view. Renders the
advanced parameters (blur, sharpen, CLAHE, brightness, normalize)
as image-variant-style \`PprocParamRow\` rows: icon tile, label,
inline number field, and a checkbox that resets to the default.
Reads and writes the preprocessing store directly.
`,
      },
    },
  },
} satisfies Meta<typeof PprocOptionsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default view with the full parameter grid. */
export const Default: Story = {};
