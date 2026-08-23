import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import { useAppStore } from '@/stores/app';

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
    isDisabled: { control: 'boolean' },
    isFileSelectDisabled: { control: 'boolean' },
    fileSelectDisabledReason: { control: 'text' },
    searchEngineState: {
      control: 'select',
      options: [undefined, 'unknown', 'unavailable', 'disabled', 'enabled'],
    },
    searchSources: { control: 'object' },
  },
  args: {
    conversationId: '',
    value: '',
    thinkOptions: ['off', 'low', 'medium', 'high'],
    thinkValue: 'medium',
    contextSizeOptions: ['2048', '4096', '8192'],
    contextSizeValue: '4096',
    defaultContextSize: '4096',
    formatContextSize: (value: string) => value,
    isDisabled: false,
    isFileSelectDisabled: false,
    fileSelectDisabledReason: undefined,
    searchSources: [],
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
    onToggleSearchEngine: fn(),
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

/** No search engine configured — non-interactive globe-off with tooltip. */
export const NoSearchEngine: Story = {
  args: { searchEngineState: 'unavailable' },
};

/** Search engine connected — globe kill switch. */
export const SearchEngineEnabled: Story = {
  args: { searchEngineState: 'enabled' },
};

/** Search engine killed — globe-off toggle re-enables it, no source tags. */
export const SearchEngineDisabled: Story = {
  args: {
    searchEngineState: 'disabled',
    searchSources: [
      { key: 'web', enabled: true },
      { key: 'news', enabled: false },
    ],
  },
};

/** Search engine connected with sources enabled — tags on the top edge. */
export const SearchEngineWithSources: Story = {
  args: {
    searchEngineState: 'enabled',
    searchSources: [
      { key: 'web', enabled: true },
      { key: 'images', enabled: true },
      { key: 'news', enabled: false },
      { key: 'scrape', enabled: true },
    ],
  },
};

/** Active conversation — per-conversation view toggles on the top edge. */
export const WithViewToggles: Story = {
  args: {
    conversationId: 'conversation-1',
  },
};

/** Active conversation plus search sources — toggles after the tags. */
export const ViewTogglesWithSources: Story = {
  args: {
    conversationId: 'conversation-1',
    searchEngineState: 'enabled',
    searchSources: [
      { key: 'web', enabled: true },
      { key: 'news', enabled: false },
    ],
  },
};

/** Both menus collapsed to their expand arrows (menus set collapsible). */
export const CollapsedMenus: Story = {
  render: (args) => ({
    components: { ChatPromptActionBar },
    setup() {
      const appStore = useAppStore();
      appStore.setSourceTagsMenuAlwaysShow('sources', false);
      appStore.setSourceTagsMenuAlwaysShow('view', false);
      appStore.setSourceTagsMenuCollapsed('sources', true);
      appStore.setSourceTagsMenuCollapsed('view', true);
      return { args };
    },
    template: '<ChatPromptActionBar v-bind="args" />',
  }),
  args: {
    conversationId: 'conversation-1',
    searchEngineState: 'enabled',
    searchSources: [
      { key: 'web', enabled: true },
      { key: 'news', enabled: false },
    ],
  },
};
