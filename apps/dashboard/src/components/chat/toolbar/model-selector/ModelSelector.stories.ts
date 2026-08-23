import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ModelSelector from './ModelSelector.vue';

const sampleModels = [
  {
    model: 'llama3',
    parameter_size: '8B',
    quantization_level: 'Q4_0',
    capabilities: ['text-generation'],
    context_length: 8192,
  },
  {
    model: 'mistral',
    parameter_size: '7B',
    quantization_level: 'Q5_0',
    capabilities: ['text-generation'],
    context_length: 4096,
  },
];

const sampleCloudModels = [
  {
    model: 'gpt-oss:120b',
    origin: 'cloud' as const,
    parameter_size: '120B',
    capabilities: ['text-generation'],
  },
];

const meta = {
  title: 'Chat/Toolbar/ModelSelector/ModelSelector',
  component: ModelSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Dropdown for selecting the active model. Shows a brain icon button and label
that opens the model list. The label highlights when the selected model is
unavailable in the current model list.
`,
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    selectedModelName: { control: 'text' },
    isModelMissing: { control: 'boolean' },
    isLoading: { control: 'boolean' },
  },
  args: {
    isOpen: false,
    selectedModelName: 'llama3',
    isModelMissing: false,
    localModels: sampleModels,
    cloudModels: [],
    isLoading: false,
    onToggleMenu: fn(),
    onSelectModel: fn(),
  },
} satisfies Meta<typeof ModelSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed — just the label and icon button. */
export const Closed: Story = {};

/** Open — showing the model dropdown list. */
export const Open: Story = { args: { isOpen: true } };

/** Open with cloud models — local and cloud groups split by a divider. */
export const OpenWithCloudModels: Story = {
  args: { isOpen: true, cloudModels: sampleCloudModels },
};

/** Model missing — label highlighted. */
export const ModelMissing: Story = {
  args: { isModelMissing: true },
};

/** Loading models. */
export const Loading: Story = {
  args: { isLoading: true, localModels: [] },
};

/** No model selected. */
export const NoModel: Story = {
  args: { selectedModelName: '' },
};
