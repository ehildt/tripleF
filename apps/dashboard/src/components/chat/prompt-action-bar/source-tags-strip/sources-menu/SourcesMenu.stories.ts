import { Globe, Image, Newspaper } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import SourcesMenu from './SourcesMenu.vue';

const meta = {
  title: 'Chat/PromptActionBar/SourcesMenu',
  component: SourcesMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Search-source toggle menu floating on the prompt bar's top border. Renders
one toggle per search source (orange), plus the EODHD Landmark. Collapses to
an expand arrow when not pinned open.
`,
      },
    },
  },
  argTypes: {
    collapsed: { control: 'boolean' },
    alwaysShow: { control: 'boolean' },
  },
  args: {
    sourceTags: [
      { key: 'web', enabled: true, icon: Globe, title: 'web source on' },
      { key: 'images', enabled: true, icon: Image, title: 'images source on' },
      {
        key: 'news',
        enabled: false,
        icon: Newspaper,
        title: 'news source off',
      },
    ],
    eodhdState: { available: true, enabled: true },
    eodhdToggleTitle: 'EODHD stock market on',
    collapsed: false,
    alwaysShow: true,
    toggleTitle: 'Collapse section',
    onToggle: fn(),
    onToggleSource: fn(),
    onToggleEodhd: fn(),
  },
} satisfies Meta<typeof SourcesMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pinned open (default) — all source toggles visible, no arrow. */
export const AlwaysShow: Story = {};

/** Collapsible and expanded — arrow + all toggles. */
export const Expanded: Story = { args: { alwaysShow: false } };

/** Collapsible and collapsed — only the expand arrow. */
export const Collapsed: Story = {
  args: { alwaysShow: false, collapsed: true },
};
