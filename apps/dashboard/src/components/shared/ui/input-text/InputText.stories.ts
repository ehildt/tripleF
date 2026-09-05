import { Search } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import InputText from './InputText.vue';

const meta = {
  title: 'Shared/UI/InputText/InputText',
  component: InputText,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Single-line text input with optional prepend icon slot. Emits
update:modelValue on input. The borderless variant drops the frame for
the FieldCard field slots, where the surrounding box IS the frame.`,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    variant: { control: 'radio', options: ['boxed', 'borderless'] },
  },
  args: {
    modelValue: '',
    placeholder: 'Enter text',
    disabled: false,
  },
} satisfies Meta<typeof InputText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty input with placeholder. */
export const Empty: Story = {};

/** Filled input. */
export const Filled: Story = { args: { modelValue: 'Hello world' } };

/** Disabled input. */
export const Disabled: Story = { args: { disabled: true } };

/** Borderless variant as used inside the FieldCard field slot. */
export const Borderless: Story = {
  args: { variant: 'borderless', modelValue: 'hello:world' },
};

/** With prepend icon. */
export const WithPrependIcon: Story = {
  render: (args) => ({
    components: { InputText, Search },
    setup() {
      return { args };
    },
    template: `
      <InputText v-bind="args">
        <template #prepend-icon>
          <Search class="w-4 h-4 text-fg-muted" />
        </template>
      </InputText>
    `,
  }),
};
