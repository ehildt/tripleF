import { Clapperboard, Images, Key, Languages, Link } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ViewMenu from './ViewMenu.vue';

const meta = {
  title: 'Chat/PromptActionBar/ViewMenu',
  component: ViewMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
View-control menu floating on the prompt bar's top border: the scroll-mode
toggle, one presentation-switch toggle per media section (image gallery ↔
list, video gallery ↔ list), and one hide/show toggle per text response
section (blue). Collapses to an expand arrow when not pinned open.
`,
      },
    },
  },
  argTypes: {
    collapsed: { control: 'boolean' },
    alwaysShow: { control: 'boolean' },
  },
  args: {
    scrollMode: 'carousel',
    scrollModeTitle: 'Carousel scroll',
    presentationToggles: [
      {
        key: 'gallery',
        media: 'image',
        icon: Images,
        presentation: 'gallery',
        title: 'Switch to image list',
      },
      {
        key: 'videoGallery',
        media: 'video',
        icon: Clapperboard,
        presentation: 'list',
        title: 'Switch to video gallery',
      },
    ],
    sectionToggles: [
      { key: 'sources', icon: Link, hidden: true, title: 'Show Sources' },
      {
        key: 'keyFindings',
        icon: Key,
        hidden: false,
        title: 'Hide Key findings',
      },
      {
        key: 'internationalCoverage',
        icon: Languages,
        hidden: false,
        title: 'Hide International coverage',
      },
    ],
    collapsed: false,
    alwaysShow: true,
    toggleTitle: 'Collapse section',
    onToggle: fn(),
    onToggleScrollMode: fn(),
    onToggleSection: fn(),
    onTogglePresentation: fn(),
  },
} satisfies Meta<typeof ViewMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pinned open (default) — all toggles visible, no arrow. */
export const AlwaysShow: Story = {};

/** Collapsible and expanded — arrow + all toggles. */
export const Expanded: Story = { args: { alwaysShow: false } };

/** Collapsible and collapsed — only the expand arrow. */
export const Collapsed: Story = {
  args: { alwaysShow: false, collapsed: true },
};

/** Image list active — the image toggle reads as switched to list. */
export const ImageList: Story = {
  args: {
    presentationToggles: [
      {
        key: 'gallery',
        media: 'image',
        icon: Images,
        presentation: 'list',
        title: 'Switch to image gallery',
      },
      {
        key: 'videoGallery',
        media: 'video',
        icon: Clapperboard,
        presentation: 'list',
        title: 'Switch to video gallery',
      },
    ],
  },
};
