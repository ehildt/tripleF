import type { Meta, StoryObj } from '@storybook/vue3-vite';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  type PreprocessingSettings,
} from '../../../../stores/preprocessing';
import DlqPreprocessingParams from './DlqPreprocessingParams.vue';

const meta = {
  title: 'Dlq/DetailsBody/PreprocessingParams/DlqPreprocessingParams',
  component: DlqPreprocessingParams,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The detailed numeric parameters for the DLQ preprocessing pipeline: blur
sigma, sharpen sigmas, CLAHE dimensions, brightness, and normalization
percentiles. Rendered as a 3-column grid of \`PreprocessingParamTile\`
inputs.
`,
      },
    },
  },
  args: {
    settings: {
      ...DEFAULT_PREPROCESSING_SETTINGS,
      enabled: true,
    } as PreprocessingSettings,
    disabled: false,
  },
} satisfies Meta<typeof DlqPreprocessingParams>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — preprocessing enabled, defaults. */
export const Default: Story = {};

/** Preprocessing disabled — inputs are inactive. */
export const Disabled: Story = {
  args: { settings: DEFAULT_PREPROCESSING_SETTINGS, disabled: true },
};
