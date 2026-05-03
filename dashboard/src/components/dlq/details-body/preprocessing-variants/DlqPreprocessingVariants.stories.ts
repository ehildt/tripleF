import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  type PreprocessingSettings,
} from '../../../../stores/preprocessing';
import DlqPreprocessingVariants from './DlqPreprocessingVariants.vue';

const meta = {
  title: 'Dlq/DetailsBody/PreprocessingVariants/DlqPreprocessingVariants',
  component: DlqPreprocessingVariants,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The variants section of the DLQ details body. Renders one toggle per
preprocessing variant (Original, Grayscale, Denoise, Sharpen, CLAHE).
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
    'onUpdate:settings': fn(),
  },
} satisfies Meta<typeof DlqPreprocessingVariants>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — preprocessing enabled, no variants selected. */
export const Default: Story = {};

/** Original and Grayscale selected. */
export const WithSelections: Story = {
  args: {
    settings: {
      ...DEFAULT_PREPROCESSING_SETTINGS,
      enabled: true,
      variants: {
        ...DEFAULT_PREPROCESSING_SETTINGS.variants,
        original: true,
        grayscale: true,
      },
    } as PreprocessingSettings,
  },
};

/** Preprocessing disabled — toggles are inactive. */
export const Disabled: Story = {
  args: {
    settings: DEFAULT_PREPROCESSING_SETTINGS,
  },
};
