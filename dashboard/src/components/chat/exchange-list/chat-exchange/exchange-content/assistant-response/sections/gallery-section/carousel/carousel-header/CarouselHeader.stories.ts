import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import CarouselHeader from './CarouselHeader.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/AssistantCarousel/CarouselHeader',
  component: CarouselHeader,
  tags: ['autodocs'],
  argTypes: {
    activeIndex: { control: { type: 'range', min: 0, max: 4 } },
    count: { control: { type: 'range', min: 1, max: 6 } },
    title: { control: 'text' },
  },
  args: {
    activeIndex: 1,
    count: 3,
    title: 'Gallery',
    onSelect: fn(),
  },
} satisfies Meta<typeof CarouselHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Title on the left, dots right-aligned on the same row. */
export const WithTitle: Story = {};

/** No title — the dots alone, right-aligned. */
export const DotsOnly: Story = { args: { title: undefined } };

/** A single slide hides the dots entirely. */
export const SingleSlide: Story = { args: { count: 1 } };
