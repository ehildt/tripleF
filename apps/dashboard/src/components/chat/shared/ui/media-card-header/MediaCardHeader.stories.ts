import { Info } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import PlaylistToggleButton from '../playlist-toggle-button/PlaylistToggleButton.vue';
import MediaCardHeader from './MediaCardHeader.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/MediaCardHeader',
  component: MediaCardHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Header row of a media surface card: truncated title linking to its source,
with an optional actions column (info/playlist toggles). The \`flush\`
variant drops the padding for the carousel's glass caption bar.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    url: { control: 'text' },
    clamp: { control: 'select', options: [1, 2] },
    tooltip: { control: 'boolean' },
    flush: { control: 'boolean' },
  },
  args: {
    title: 'Review of the Sony WH-1000XM5 headphones',
    url: 'https://example.com/review',
    clamp: 1,
    tooltip: false,
    flush: false,
  },
} satisfies Meta<typeof MediaCardHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default card-surface header: single-line title + actions. */
export const WithActions: Story = {
  render: (args) => ({
    components: { MediaCardHeader, IconButton, PlaylistToggleButton, Info },
    setup: () => ({ args }),
    template: `
      <MediaCardHeader v-bind="args">
        <template #actions>
          <IconButton title="More info" aria-label="More info" size="lg">
            <Info />
          </IconButton>
          <PlaylistToggleButton :active="false" />
        </template>
      </MediaCardHeader>`,
  }),
};

/** Two-line clamp for hero titles. */
export const HeroClamp: Story = { args: { clamp: 2 } };

/** Tooltip for long truncated titles. */
export const WithTooltip: Story = { args: { tooltip: true } };

/** Flush variant for the carousel caption bar. */
export const CarouselCaption: Story = { args: { flush: true, tooltip: true } };
