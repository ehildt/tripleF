import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import ModelList from './ModelList.vue';

const meta = {
  title: 'Chat/Toolbar/ModelSelector/ModelList/ModelList',
  component: ModelList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Dropdown panel displaying available models for selection.

Receives the model list and selection state as props. Emits \`select\` when a model is clicked.
Handles loading, empty, and populated states internally.`,
      },
    },
  },
  argTypes: {
    loading: { control: 'boolean' },
    selectedModel: { control: 'text' },
  },
  args: {
    models: [
      { model: 'llama3:8b', parameter_size: '8B' },
      { model: 'mistral:7b', parameter_size: '7B' },
      { model: 'gemma:7b', parameter_size: '7B' },
    ],
    selectedModel: 'llama3:8b',
    loading: false,
  },
  render: (args) => ({
    components: { ModelList },
    setup() {
      const selected = ref(args.selectedModel);
      watch(
        () => args.selectedModel,
        (v) => {
          selected.value = v;
        },
      );
      function onSelect(model: string) {
        selected.value = model;
      }
      return { args, selected, onSelect };
    },
    template: `
      <div style="width: 260px; background: var(--color-bg-elevated); border: 1px solid var(--color-divider); box-shadow: 0 4px 12px color-mix(in srgb, var(--color-bg-primary) 30%, transparent);">
        <ModelList
          :models="args.models"
          :selected-model="selected"
          :loading="args.loading"
          @select="onSelect"
        />
      </div>
    `,
  }),
} satisfies Meta<typeof ModelList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state with a few models, one selected. */
export const Default: Story = {};

/** Multiple models with quantization info. */
export const WithQuantizationLevels: Story = {
  args: {
    models: [
      {
        model: 'llama3-instruct-q4_K_M.gguf',
        parameter_size: '8B',
        quantization_level: 'q4_K_M',
      },
      {
        model: 'llama2-uncensored.Q5_K_S.gguf',
        parameter_size: '70B',
        quantization_level: 'Q5_K_S',
      },
    ],
    selectedModel: 'llama3-instruct-q4_K_M.gguf',
  },
};

/** Loading state — spinner shown. */
export const Loading: Story = {
  args: { models: [], loading: true },
};

/** Empty state — no models and not loading. */
export const Empty: Story = {
  args: { models: [], selectedModel: '', loading: false },
};

/** Long list triggers scroll container. */
export const LongList: Story = {
  args: {
    models: Array.from({ length: 15 }, (_, i) => ({
      model: `model-${String(i + 1).padStart(3, '0')}.gguf`,
      parameter_size: `${[7, 8, 13, 30, 65][i % 5]}B`,
    })),
    selectedModel: 'model-003.gguf',
  },
};
