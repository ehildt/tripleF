import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AsyncImage from './AsyncImage.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/AsyncImage',
  component: AsyncImage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Async image atom: pulse skeleton while fetching, fade-in on load, quiet
"Image unavailable" overlay on error. The parent owns the box and captions.
`,
      },
    },
  },
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    eager: { control: 'boolean' },
    fit: { control: 'select', options: ['cover', 'contain'] },
    showErrorLabel: { control: 'boolean' },
  },
  args: {
    src: 'https://picsum.photos/seed/async-image/640/360',
    alt: 'Sample image',
    eager: false,
    fit: 'cover',
    showErrorLabel: true,
  },
} satisfies Meta<typeof AsyncImage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Lazy-loaded cover tile (the default for galleries and lists). */
export const Cover: Story = {};

/** Contain mode for square product thumbs. */
export const Contain: Story = { args: { fit: 'contain' } };

/** Eager + high-priority loading for LCP hero candidates. */
export const EagerHero: Story = { args: { eager: true } };

/** Failed load renders the "Image unavailable" overlay. */
export const ErrorState: Story = {
  args: { src: 'https://picsum.photos/seed/missing/640/360' },
};

/** Tiny thumb that settles on a quiet empty box instead of the overlay. */
export const QuietError: Story = {
  args: {
    src: 'https://picsum.photos/seed/missing/640/360',
    showErrorLabel: false,
  },
};
