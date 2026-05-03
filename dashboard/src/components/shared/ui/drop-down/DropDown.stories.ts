import { Cherry, CircleGauge } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ref, watch } from 'vue';

import { formatCtx } from '@/utils/format-ctx.helper';

import DropDown from './DropDown.vue';

const fruitOptions = ['Poison Apple', 'Poison Berry', 'Poison Cherry'];
const numCtxOptions = ['262144', '524288', '1048576', '2097152'];

function renderStory(icon = Cherry) {
  return (args: any) => ({
    components: { DropDown, Cherry, CircleGauge },
    setup() {
      const modelValue = ref(args.modelValue);

      watch(
        () => args.modelValue,
        (val) => {
          modelValue.value = val;
        },
      );

      const onUpdate = (val: string) => {
        args['onUpdate:modelValue'](val);
      };

      return { args, modelValue, onUpdate, icon };
    },
    template: `
      <div style="display: flex; justify-content: center; padding-top: 120px; height: 300px;">
        <DropDown
          :variant="args.variant"
          :align="args.align"
          :side="args.side"
          :label="args.label"
          :options="args.options"
          v-model="modelValue"
          :disabled="args.disabled"
          :placeholder="args.placeholder"
          :format-value="args.formatValue"
          @update:model-value="onUpdate"
          @open="args.onOpen"
        >
          <component :is="icon" style="width: 16px; height: 16px;" />
        </DropDown>
      </div>
    `,
  });
}

const meta = {
  title: 'Shared/UI/DropDown/DropDown',
  component: DropDown,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A reusable dropdown with two visual variants:

- **\`labeled\`** — input-style trigger showing an icon, label, current value, and optional error indicator.
- **\`icon-only\`** — compact toolbar button showing only the icon until a value is selected.

Built on \`useDropdown\` for open/close state, outside-click dismissal, and Escape key handling.
The menu can be positioned with \`align\` (left, center, right) and \`side\` (top, bottom).
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['labeled', 'icon-only'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    side: {
      control: 'select',
      options: ['top', 'bottom'],
    },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    modelValue: { control: 'text' },
    placeholder: { control: 'text' },
    options: { control: 'object' },
  },
  args: {
    variant: 'labeled',
    align: 'left',
    side: 'bottom',
    label: 'Fruit',
    options: fruitOptions,
    modelValue: '',
    disabled: false,
    placeholder: 'Choose your poison',
    formatValue: undefined,
    'onUpdate:modelValue': fn(),
    onOpen: fn(),
  },
  render: renderStory(),
} satisfies Meta<typeof DropDown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Labeled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default state with no value selected. Displays the placeholder text in place of a value.',
      },
    },
  },
};

export const LabeledWithValue: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'An option has been selected — the chosen value is shown next to the label.',
      },
    },
  },
  args: {
    modelValue: 'Poison Berry',
  },
};

export const LabeledLargeValue: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Uses `formatValue` to transform large numeric values into readable context lengths (e.g. `1073741824` → `1 GB`).',
      },
    },
  },
  render: renderStory(CircleGauge),
  args: {
    label: 'Context',
    modelValue: '262144',
    options: numCtxOptions,
    formatValue: (v: string) => formatCtx(Number(v)),
    placeholder: '',
  },
};

export const LabeledRaw: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Without `formatValue` — the raw option string is shown as-is. Compare with the formatted variant above.',
      },
    },
  },
  render: renderStory(CircleGauge),
  args: {
    label: 'Context',
    modelValue: '262144',
    options: numCtxOptions,
  },
};

export const LabeledDisabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Disabled state — the trigger is dimmed and interaction is blocked. Useful for read-only contexts.',
      },
    },
  },
  args: {
    modelValue: 'Poison Cherry',
    disabled: true,
  },
};

export const LabeledWithPlaceholder: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Custom placeholder text. Shown when no value is selected; falls back to the `label` prop when empty.',
      },
    },
  },
  args: {
    placeholder: 'Pick a fruit...',
  },
};

export const IconOnly: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Compact toolbar variant — shows only the icon. The menu opens below the trigger on click.',
      },
    },
  },
  args: {
    variant: 'icon-only',
  },
};

export const IconOnlyWithValue: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Icon-only with a selected value. The trigger remains compact but the value is tracked internally.',
      },
    },
  },
  args: {
    variant: 'icon-only',
    modelValue: 'Poison Fig',
  },
};

export const IconOnlyDisabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Icon-only in disabled state — the button is dimmed and cannot be opened.',
      },
    },
  },
  args: {
    variant: 'icon-only',
    disabled: true,
    modelValue: 'Poison Cherry',
  },
};

export const InteractionTest: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Playwright interaction test: opens the menu, verifies an option is visible, clicks it, and asserts the `update:modelValue` emit.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByRole('button');
    await expect(trigger).toBeInTheDocument();

    await userEvent.click(trigger);
    const option = canvas.getByText('Poison Apple');
    await expect(option).toBeInTheDocument();

    await userEvent.click(option);
    await expect(args['onUpdate:modelValue']).toHaveBeenCalledWith(
      'Poison Apple',
    );
  },
};
