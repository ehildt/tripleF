import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ModelListItem from './ModelListItem.vue';

const meta = {
  title: 'Chat/Toolbar/ModelSelector/ModelList/ModelListItem',
  component: ModelListItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single selectable model row inside the model selector dropdown. Shows the
model name with optional parameter size and quantization metadata, plus a
row of capability icons (vision, tools, thinking) for the features the
model supports. The local/cloud grouping is communicated by the section
dividers in the list, so the item itself carries no origin icon.`,
      },
    },
  },
  argTypes: {
    selected: { control: 'boolean' },
  },
  args: {
    model: { model: 'llama3:8b', parameter_size: '8B' },
    selected: false,
    onSelect: fn(),
  },
  render: (args) => ({
    components: { ModelListItem },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 260px; background: var(--color-bg-elevated); border: 1px solid var(--color-divider);">
        <ModelListItem :model="args.model" :selected="args.selected" @select="args.onSelect" />
      </div>
    `,
  }),
} satisfies Meta<typeof ModelListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Unselected local model with parameter size. */
export const Default: Story = {};

/** Selected state. */
export const Selected: Story = {
  args: { selected: true },
};

/** Model with parameter size and quantization metadata. */
export const WithQuantization: Story = {
  args: {
    model: {
      model: 'llama3-instruct-q4_K_M.gguf',
      parameter_size: '8B',
      quantization_level: 'q4_K_M',
    },
  },
};

/** Cloud model — rendered identically, grouping comes from the divider. */
export const CloudModel: Story = {
  args: {
    model: { model: 'gpt-oss:120b', origin: 'cloud', parameter_size: '120B' },
  },
};

/** No metadata — the meta line collapses. */
export const WithoutMetadata: Story = {
  args: { model: { model: 'custom-model:latest' } },
};

/** Vision-, tools- and thinking-capable model with all badges. */
export const WithCapabilities: Story = {
  args: {
    model: {
      model: 'qwen3-vl:8b',
      parameter_size: '8B',
      capabilities: ['vision', 'audio', 'tools', 'thinking', 'completion'],
    },
  },
};
