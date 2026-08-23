import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import LightboxViewer from './LightboxViewer.vue';

const meta = {
  title: 'Shared/UI/Lightbox/LightboxViewer',
  component: LightboxViewer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Central viewer area with flanking navigation chevrons and a constrained image. Arrows stay visible but are disabled when at the start or end of the gallery.
`,
      },
    },
  },
  argTypes: {
    hasPrev: { control: 'boolean' },
    hasNext: { control: 'boolean' },
    imageUrl: { control: 'text' },
  },
  args: {
    imageUrl: 'https://placehold.co/600x450/png?text=Image',
    hasPrev: true,
    hasNext: true,
    onPrev: fn(),
    onNext: fn(),
  },
} satisfies Meta<typeof LightboxViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Both arrows enabled. */
export const Middle: Story = {};

/** Left arrow disabled — first image in gallery. */
export const First: Story = { args: { hasPrev: false, hasNext: true } };

/** Right arrow disabled — last image in gallery. */
export const Last: Story = { args: { hasPrev: true, hasNext: false } };

/** Both arrows disabled — single image gallery. */
export const Single: Story = { args: { hasPrev: false, hasNext: false } };
