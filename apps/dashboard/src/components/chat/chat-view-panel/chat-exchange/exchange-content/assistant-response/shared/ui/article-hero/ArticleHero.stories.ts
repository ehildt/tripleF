import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleHero from './ArticleHero.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/ArticleHero',
  component: ArticleHero,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The hero region shared by the snippet templates: title/subtitle header plus
hero media (video or image), stacked or split (media beside the title).
The \`#lead\` slot renders into the text stack in split mode only.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    split: { control: 'boolean' },
    heroVideoUrl: { control: 'text' },
    heroVideoTitle: { control: 'text' },
    heroImageUrl: { control: 'text' },
    heroImageAlt: { control: 'text' },
    heroCaption: { control: 'text' },
  },
  args: {
    title: 'Global markets rally on rate-cut hopes',
    subtitle: 'Stocks closed higher across Europe and Asia',
    split: false,
    heroImageUrl: 'https://picsum.photos/seed/article-hero/1280/720',
    heroImageAlt: 'Market floor',
    heroCaption: 'Trading floor activity',
  },
} satisfies Meta<typeof ArticleHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stacked: title above the hero media. */
export const Stacked: Story = {};

/** Split (ar2): media beside the title stack with a lead. */
export const Split: Story = {
  args: { split: true },
  render: (args) => ({
    components: { ArticleHero },
    setup: () => ({ args }),
    template: `
      <ArticleHero v-bind="args">
        <template #lead>
          <p style="margin:0;font-size:1.05em;color:var(--color-fg-secondary);border-left:3px solid var(--color-accent-primary);padding-left:0.75em">
            A short lead paragraph sits under the headline in the split stack.
          </p>
        </template>
      </ArticleHero>`,
  }),
};

/** Video hero with a title link. */
export const VideoHero: Story = {
  args: {
    heroVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    heroVideoTitle: 'Watch the market wrap-up',
    heroImageUrl: undefined,
    heroCaption: undefined,
  },
};
