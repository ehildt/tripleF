import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ModelSelectField from './ModelSelectField.vue';

const MODELS = ['qwen3.8:27b', 'gemma4:26b', 'gpt-oss:120b'];

const meta = {
  title: 'Settings/MemorySection/ModelSelectField',
  component: ModelSelectField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Model-override picker for the Memory tab fields: a borderless InputSelect
whose first option is the env-baseline "Default" — picking it clears the
override. An override missing from the catalog is appended so it stays
visible and selectable.`,
      },
    },
  },
  args: { modelValue: '', options: MODELS },
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
export const EmptyCatalog: Story = { args: { options: [] } };
