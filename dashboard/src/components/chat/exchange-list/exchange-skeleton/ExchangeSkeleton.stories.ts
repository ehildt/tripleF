import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ExchangeSkeleton from './ExchangeSkeleton.vue';

const meta = {
  title: 'Chat/ExchangeList/ExchangeSkeleton/ExchangeSkeleton',
  component: ExchangeSkeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Loading placeholder for the main exchange column: shown while the
conversation list is still booting or the active conversation's full content
is being fetched. Mirrors the layout of a user prompt plus an assistant
block, sized to the same scroll container as the real list so the swap to
content causes no layout shift. Decorative (aria-hidden).
`,
      },
    },
  },
} satisfies Meta<typeof ExchangeSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default skeleton during conversation hydration. */
export const Default: Story = {};
