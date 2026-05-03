import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AppBrand from './AppBrand.vue';

const meta = {
  title: 'App/Header/AppBrand',
  component: AppBrand,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Brand block with animated logo and title.',
      },
    },
  },
  argTypes: {
    tabColor: { control: 'color' },
    blinkLogo: { control: 'boolean' },
  },
  args: {
    tabColor: 'var(--color-tab-accent)',
    blinkLogo: false,
  },
} satisfies Meta<typeof AppBrand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Static brand. */
export const Static: Story = {};

/** Blinking logo, as used when the app wants attention. */
export const Blinking: Story = {
  args: { blinkLogo: true },
};
