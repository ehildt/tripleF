import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ChatMainColumn from './ChatMainColumn.vue';

const meta = {
  title: 'Chat/MainColumn',
  component: ChatMainColumn,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Main conversational area of the chat view. Combines the exchange list
(messages) and the prompt action bar (input) into a single column.
`,
      },
    },
  },
  args: {
    value: '',
    isCompacting: false,
    thinkOptions: ['none', 'low', 'medium', 'high'],
    thinkValue: 'medium',
    contextSizeOptions: ['2048', '4096', '8192'],
    contextSizeValue: '4096',
    defaultContextSize: '4096',
    formatContextSize: (value: string) => `${value} tokens`,
    isDisabled: false,
    isFileSelectDisabled: false,
    searchEngineState: 'disabled',
    searchSources: [{ key: 'web', enabled: true }],
    setActionBarRef: fn(),
    setThinkDropdownRef: fn(),
    setContextSizeDropdownRef: fn(),
    retryHandler: fn(),
    input: fn(),
    keydown: fn(),
    selectThink: fn(),
    selectContextSize: fn(),
    openThink: fn(),
    openContextSize: fn(),
    disabledHoverStart: fn(),
    disabledHoverEnd: fn(),
    fileSelect: fn(),
    toggleSearchEngine: fn(),
    toggleSource: fn(),
    deleteConversation: fn(),
    toggleIncluded: fn(),
  },
} satisfies Meta<typeof ChatMainColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default main column with no active conversation. */
export const Default: Story = {};

/** Prompt bar disabled because no model is selected. */
export const Disabled: Story = {
  args: {
    isDisabled: true,
    isFileSelectDisabled: true,
  },
};

/** Search engine enabled with source toggles on the prompt bar. */
export const SearchEnabled: Story = {
  args: {
    searchEngineState: 'enabled',
    searchSources: [
      { key: 'web', enabled: true },
      { key: 'images', enabled: false },
    ],
  },
};
