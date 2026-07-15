import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ExchangeLightboxHeader from './ExchangeLightboxHeader.vue';

const meta = {
  title:
    'Chat/ExchangeList/ChatExchange/ExchangeLightbox/ExchangeLightboxHeader',
  component: ExchangeLightboxHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Top of the lightbox panel. Shows an optional caption title on the left and a close button on the right, framed by a divider border.
`,
      },
    },
  },
  argTypes: {
    activeTitle: { control: 'text' },
  },
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof ExchangeLightboxHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Close button only — no caption. */
export const Empty: Story = {};

/** Caption title visible beside close button. */
export const WithTitle: Story = {
  args: { activeTitle: 'Sunset over the harbor' },
};
