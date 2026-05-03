import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ChatPromptActionBar from './ChatPromptActionBar.vue';

const meta = {
  title: 'Chat/PromptActionBar',
  component: ChatPromptActionBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Prompt input and action bar for the chat view. Renders the textarea,
think/context dropdowns, and the file attachment trigger.
`,
      },
    },
  },
  argTypes: {
    value: { control: 'text' },
    isCompacting: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isFileSelectDisabled: { control: 'boolean' },
    fileSelectDisabledReason: { control: 'text' },
  },
  args: {
    value: '',
    isCompacting: false,
    thinkOptions: ['off', 'low', 'medium', 'high'],
    thinkValue: 'medium',
    contextSizeOptions: ['2048', '4096', '8192'],
    contextSizeValue: '4096',
    defaultContextSize: '4096',
    formatContextSize: (value: string) => value,
    isDisabled: false,
    isFileSelectDisabled: false,
    fileSelectDisabledReason: undefined,
    setActionBarRef: fn(),
    setThinkDropdownRef: fn(),
    setContextSizeDropdownRef: fn(),
    onInput: fn(),
    onKeydown: fn(),
    onSelectThink: fn(),
    onSelectContextSize: fn(),
    onOpenThink: fn(),
    onOpenContextSize: fn(),
    onDisabledHoverStart: fn(),
    onDisabledHoverEnd: fn(),
    onFileSelect: fn(),
  },
} satisfies Meta<typeof ChatPromptActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty prompt input. */
export const Empty: Story = {};

/** Prompt input with text. */
export const WithText: Story = {
  args: { value: 'Describe this image' },
};

/** Disabled state (no model selected). */
export const Disabled: Story = {
  args: { isDisabled: true, isFileSelectDisabled: true },
};

/** File select disabled because model does not support images. */
export const NoVision: Story = {
  args: {
    isFileSelectDisabled: true,
    fileSelectDisabledReason: 'Selected model does not support images',
  },
};
