import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  type PreprocessingSettings,
} from '../../../../stores/preprocessing';
import DlqPreprocessingSection from './DlqPreprocessingSection.vue';

const meta = {
  title: 'Dlq/DetailsBody/PreprocessingSection/DlqPreprocessingSection',
  component: DlqPreprocessingSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The preprocessing section of the DLQ details body: a master toggle and
the advanced parameters (max width, max height, prevent upscaling).
`,
      },
    },
  },
  args: {
    settings: DEFAULT_PREPROCESSING_SETTINGS,
    disabled: false,
    'onUpdate:settings': fn(),
  },
} satisfies Meta<typeof DlqPreprocessingSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — preprocessing disabled, defaults shown. */
export const Default: Story = {};

/** Preprocessing enabled. */
export const Enabled: Story = {
  args: {
    settings: {
      ...DEFAULT_PREPROCESSING_SETTINGS,
      enabled: true,
    } as PreprocessingSettings,
  },
};

/** Disabled — controls are non-interactive. */
export const Disabled: Story = { args: { disabled: true } };
