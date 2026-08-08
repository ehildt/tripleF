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
          'Seamless, endlessly-scrolling marquee text. Renders the text twice (the second copy is aria-hidden) so the -50% translate wrap is invisible, and respects prefers-reduced-motion.',
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
