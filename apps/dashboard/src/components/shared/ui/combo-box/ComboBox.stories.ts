import { Radio } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import ComboBox from './ComboBox.vue';

const meta = {
  title: 'Shared/UI/ComboBox',
  component: ComboBox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Free-text input with an optional list of existing values. Without options it
renders a plain input with a placeholder. With options, clicking the trigger
opens a menu with an input (create a new value) above a divider and the
existing options below (pick one). Clearing the text restores the
placeholder.`,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'text' },
    placeholder: { control: 'text' },
  },
  args: {
    modelValue: '',
    options: [],
    placeholder: 'room',
  },
  render: (args) => ({
    components: { ComboBox, Radio },
    setup() {
      const value = ref(args.modelValue);
      watch(
        () => args.modelValue,
        (v) => {
          value.value = v;
        },
      );
      return { args, value };
    },
    template: `
      <div style="width: 14rem;">
        <ComboBox
          v-model="value"
          :options="args.options"
          :placeholder="args.placeholder"
        >
          <Radio style="width: 0.875rem; height: 0.875rem;" />
        </ComboBox>
        <p style="margin-top: 0.5rem; font-size: 0.625rem; color: var(--color-fg-muted); font-family: var(--font-mono);">
          value: {{ value || '(empty)' }}
        </p>
      </div>
    `,
  }),
} satisfies Meta<typeof ComboBox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No options — plain input with placeholder only. */
export const PlainInput: Story = {};

/** Options exist — trigger opens input + divider + option list. */
export const WithOptions: Story = {
  args: { options: ['lobby', 'dev-team', 'release-notes'] },
};

/** Pre-filled with a picked option. */
export const WithSelectedOption: Story = {
  args: {
    modelValue: 'dev-team',
    options: ['lobby', 'dev-team', 'release-notes'],
  },
};

/** Pre-filled with a new value not in the option list. */
export const WithCustomValue: Story = {
  args: {
    modelValue: 'incident-42',
    options: ['lobby', 'dev-team'],
  },
};
