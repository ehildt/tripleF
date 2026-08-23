import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PromptInput from './PromptInput.vue';

const meta = {
  title: 'Chat/PromptActionBar/PromptInput',
  component: PromptInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The prompt input block: a mono ">" caret and the multiline textarea that
feeds the harness. Emits input/keydown/focus; the value flows in as a prop.
`,
      },
    },
  },
  argTypes: {
    value: { control: 'text' },
  },
  args: {
    value: '',
    onInput: fn(),
    onKeydown: fn(),
    onFocus: fn(),
  },
} satisfies Meta<typeof PromptInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty prompt. */
export const Empty: Story = {};

/** Prompt with text. */
export const WithText: Story = { args: { value: 'Describe this image' } };
