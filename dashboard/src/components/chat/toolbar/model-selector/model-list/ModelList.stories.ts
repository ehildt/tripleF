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

Local models come first, then Ollama Cloud models (when an Ollama API key is
configured). A search field at the top filters the list by model name. The
list is height-capped and scrolls. Receives the model groups and selection
state as props. Emits \`select\` when a model is clicked. Handles loading,
empty, and populated states internally.`,
      },
    },
  },
  argTypes: {
    loading: { control: 'boolean' },
    selectedModel: { control: 'text' },
  },
  args: {
    localModels: [
      { model: 'llama3:8b', parameter_size: '8B' },
      { model: 'mistral:7b', parameter_size: '7B' },
      { model: 'gemma:7b', parameter_size: '7B' },
    ],
    cloudModels: [],
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
          :local-models="args.localModels"
          :cloud-models="args.cloudModels"
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

/** Default state with a few local models, one selected. */
export const Default: Story = {};

/** Local and Ollama Cloud models — local first, then cloud. */
export const WithCloudModels: Story = {
  args: {
    cloudModels: [
      { model: 'gpt-oss:120b', origin: 'cloud', parameter_size: '120B' },
      { model: 'kimi-k2:1t', origin: 'cloud', parameter_size: '1T' },
    ],
  },
};

/** Cloud-only list (e.g. the configured host is ollama.com itself). */
export const CloudOnly: Story = {
  args: {
    localModels: [],
    cloudModels: [
      { model: 'gpt-oss:120b', origin: 'cloud', parameter_size: '120B' },
    ],
  },
};

/** Multiple models with quantization info. */
export const WithQuantizationLevels: Story = {
  args: {
    localModels: [
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
  args: { localModels: [], cloudModels: [], loading: true },
};

/** Empty state — no models and not loading. */
export const Empty: Story = {
  args: { localModels: [], cloudModels: [], selectedModel: '', loading: false },
};

/** Long list exceeds the height cap and scrolls. */
export const LongList: Story = {
  args: {
    localModels: Array.from({ length: 15 }, (_, i) => ({
      model: `model-${String(i + 1).padStart(3, '0')}.gguf`,
      parameter_size: `${[7, 8, 13, 30, 65][i % 5]}B`,
    })),
    selectedModel: 'model-003.gguf',
  },
};
