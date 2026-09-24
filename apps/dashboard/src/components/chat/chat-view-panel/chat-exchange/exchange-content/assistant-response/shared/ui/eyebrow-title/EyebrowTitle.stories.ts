import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EyebrowTitle from './EyebrowTitle.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/EyebrowTitle',
  component: EyebrowTitle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Small-caps section eyebrow (mono, uppercase, letter-spaced) above product
blocks: where-to-buy, key specs, pros/cons. \`tone\` tints the text;
\`ruled\` adds a bottom hairline.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    tone: { control: 'select', options: ['muted', 'success', 'error'] },
    ruled: { control: 'boolean' },
  },
  args: {
    title: 'Where to buy',
    tone: 'muted',
    ruled: false,
  },
} satisfies Meta<typeof EyebrowTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Neutral muted eyebrow (where-to-buy, key specs). */
export const Muted: Story = {};

/** Success-tinted eyebrow with the hairline (pros column). */
export const Pros: Story = {
  args: { title: 'Pros', tone: 'success', ruled: true },
};

/** Error-tinted eyebrow with the hairline (cons column). */
export const Cons: Story = {
  args: { title: 'Cons', tone: 'error', ruled: true },
};
