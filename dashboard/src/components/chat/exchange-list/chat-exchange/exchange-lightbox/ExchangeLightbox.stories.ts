import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ExchangeLightbox from './ExchangeLightbox.vue';

const sampleImages = [
  {
    url: 'https://placehold.co/600x400/png?text=Image+1',
    title: 'First Image',
  },
  {
    url: 'https://placehold.co/600x450/png?text=Image+2',
    title: 'Second Image',
  },
  {
    url: 'https://placehold.co/600x500/png?text=Image+3',
    title: 'Third Image',
  },
];

const meta = {
  title: 'Chat/ExchangeList/ChatExchange/ExchangeLightbox/ExchangeLightbox',
  component: ExchangeLightbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Teleported full-screen image lightbox centered in a 60vw panel with
blurred backdrop. Features a header, footer with pagination dots and
a counter, prev/next flanking the image. Pure presentational — parents
via an orchestrator (ChatExchange) passing props and listening to events.
Arrows remain visible but are disabled/grayscale when at the start/end.
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
    activeTitle: sampleImages[1].title,
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

/** First image — left arrow grays out and is disabled. */
export const First: Story = { args: { index: 0 } };

/** Last image — right arrow grays out and is disabled. */
export const Last: Story = { args: { index: 2 } };

/** Single image — both arrows grays out, single dot active. */
export const Single: Story = {
  args: { images: [sampleImages[0]], index: 0 },
};

/** Closed — nothing rendered. */
export const Closed: Story = { args: { isOpen: false } };
