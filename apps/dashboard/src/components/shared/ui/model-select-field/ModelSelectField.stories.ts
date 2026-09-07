import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ModelSelectField from './ModelSelectField.vue';

const LOCAL_MODELS = [
  { model: 'qwen3.8:27b', parameter_size: '27B' },
  { model: 'gemma4:26b', parameter_size: '26B' },
];
const CLOUD_MODELS = [
  { model: 'gpt-oss:120b', origin: 'cloud', parameter_size: '120B' },
];

const meta = {
  title: 'Shared/UI/ModelSelectField',
  component: ModelSelectField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Model-override picker for the Memory tab fields: a borderless trigger in the
FieldCard's field slot, a teleported dropdown with the shared searchable model
list, and a "Default" pseudo-option that clears the override (env baseline).
An override missing from the catalog is prepended so it stays selectable.
`,
      },
    },
  },
  args: {
    modelValue: '',
    localModels: LOCAL_MODELS,
    cloudModels: CLOUD_MODELS,
    loading: false,
  },
  argTypes: {
    modelValue: { control: 'text' },
  },
} satisfies Meta<typeof ModelSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No override — the "Default" baseline option is selected. */
export const Default: Story = {};

/** An override picked from the catalog. */
export const OverrideFromCatalog: Story = {
  args: { modelValue: 'gemma4:26b' },
};

/** An override that is no longer in the catalog is still shown. */
export const OverrideMissingFromCatalog: Story = {
  args: { modelValue: 'removed:7b' },
};

/** Empty catalog (models not loaded) — the default option still renders. */
export const EmptyCatalog: Story = {
  args: { localModels: [], cloudModels: [], loading: false },
};
