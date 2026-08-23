import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import LightboxFooter from './LightboxFooter.vue';

const meta = {
  title: 'Shared/UI/Lightbox/LightboxFooter',
  component: LightboxFooter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Bottom of the lightbox panel. Pagination dots and an index counter framed by a divider border.
`,
      },
    },
  },
  argTypes: {
    count: { control: 'number' },
    activeIndex: { control: 'number' },
  },
  args: {
    count: 3,
    activeIndex: 1,
    onSelectIndex: fn(),
  },
} satisfies Meta<typeof LightboxFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Middle dot active. */
export const Middle: Story = {};

/** First dot active. */
export const First: Story = { args: { activeIndex: 0 } };

/** Last dot active. */
export const Last: Story = { args: { activeIndex: 2 } };

/** Single dot — only image in gallery. */
export const Single: Story = { args: { count: 1, activeIndex: 0 } };
