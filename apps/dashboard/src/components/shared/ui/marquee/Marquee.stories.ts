import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Marquee from './Marquee.vue';

const meta = {
  title: 'Shared/Marquee',
  component: Marquee,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Seamless, endlessly-scrolling text at a constant 50 px/s regardless of content length. Renders the text twice (the second copy is aria-hidden) so the -50% translate wrap is invisible, optionally renders sanitized inline Markdown, and respects prefers-reduced-motion.',
      },
    },
  },
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A long title scrolling in place. */
export const Default: Story = {
  args: {
    text: 'Now playing: a very long video title that scrolls seamlessly',
  },
};

/** A short title uses a shorter loop while retaining the same pixel speed. */
export const ShortText: Story = {
  args: {
    text: 'Now playing: short title',
  },
};

/** Inline Markdown with theme-accent strong text. */
export const InlineMarkdown: Story = {
  args: {
    text: 'Review the **theme-accent emphasis** in this history prompt.',
    markdown: true,
  },
};
