import type { Meta, StoryObj } from '@storybook/vue3-vite';

import InputTextArea from './InputTextArea.vue';

const meta = {
  title: 'Shared/UI/InputTextArea/InputTextArea',
  component: InputTextArea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Multi-line text input. Emits update:modelValue on input and keydown on
keyboard events.
`,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    rows: { control: 'number' },
  },
  args: {
    modelValue: '',
    placeholder: 'Enter text…',
    disabled: false,
    rows: 3,
  },
} satisfies Meta<typeof InputTextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty textarea. */
export const Empty: Story = {};

/** Filled textarea. */
export const Filled: Story = { args: { modelValue: 'Line one\nLine two' } };

/** Disabled textarea. */
export const Disabled: Story = { args: { disabled: true } };
