import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PromptActions from './PromptActions.vue';

const actionsClass = { 'prompt-actions': true };

const meta = {
  title: 'Chat/PromptActionBar/PromptActions',
  component: PromptActions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Action row of the prompt bar: think/context dropdowns, the file attachment
trigger, and the search-engine kill switch (or offline indicator).
`,
      },
    },
  },
  argTypes: {
    isDisabled: { control: 'boolean' },
    isFileSelectDisabled: { control: 'boolean' },
    searchEngineState: {
      control: 'select',
      options: [undefined, 'unknown', 'unavailable', 'disabled', 'enabled'],
    },
  },
  args: {
    actionsClass,
    thinkOptions: ['off', 'low', 'medium', 'high'],
    thinkValue: 'medium',
    contextSizeOptions: ['2048', '4096', '8192'],
    contextSizeValue: '4096',
    defaultContextSize: '4096',
    formatContextSize: (value: string) => value,
    isDisabled: false,
    fileSelectTitle: 'Select files',
    isFileSelectDisabled: false,
    searchEngineState: 'disabled',
    searchEngineToggleTitle: 'Web search off',
    noSearchEngineTitle: 'No search engine connected',
    setActionBarRef: fn(),
    setThinkDropdownRef: fn(),
    setContextSizeDropdownRef: fn(),
    onSelectThink: fn(),
    onOpenThink: fn(),
    onSelectContextSize: fn(),
    onOpenContextSize: fn(),
    onFileSelect: fn(),
    onToggleSearchEngine: fn(),
    onFileButtonMouseEnter: fn(),
    onFileButtonMouseLeave: fn(),
  },
} satisfies Meta<typeof PromptActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default actions row with the search-engine kill switch. */
export const Default: Story = {};

/** No search engine configured — non-interactive globe-off indicator. */
export const NoSearchEngine: Story = {
  args: { searchEngineState: 'unavailable' },
};

/** Disabled state (no model selected). */
export const Disabled: Story = {
  args: { isDisabled: true, isFileSelectDisabled: true },
};
