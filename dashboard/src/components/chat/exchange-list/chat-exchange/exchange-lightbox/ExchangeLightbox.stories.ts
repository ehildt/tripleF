import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ExchangeLightbox from './ExchangeLightbox.vue';

const sampleImages = [
  'https://placehold.co/600x600/png?text=1',
  'https://placehold.co/600x600/png?text=2',
  'https://placehold.co/600x600/png?text=3',
];

const meta = {
  title: 'Chat/ExchangeList/ChatExchange/ExchangeLightbox/ExchangeLightbox',
  component: ExchangeLightbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Teleported full-screen image lightbox. Renders prev/next arrows, dot
indicators, a close button, and an image counter. Pure presentational —
the parent owns the open state and image list.
`,
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    index: { control: 'number' },
  },
  args: {
    isOpen: true,
    images: sampleImages,
    index: 1,
    onClose: fn(),
    onPrev: fn(),
    onNext: fn(),
    onSelectIndex: fn(),
  },
} satisfies Meta<typeof ExchangeLightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Open at the middle image — both arrows visible. */
export const Middle: Story = {};

/** First image — prev hidden. */
export const First: Story = { args: { index: 0 } };

/** Last image — next hidden. */
export const Last: Story = { args: { index: 2 } };

/** Single image — both arrows and dots hidden. */
export const Single: Story = {
  args: { images: [sampleImages[0]], index: 0 },
};

/** Closed — nothing rendered. */
export const Closed: Story = { args: { isOpen: false } };
