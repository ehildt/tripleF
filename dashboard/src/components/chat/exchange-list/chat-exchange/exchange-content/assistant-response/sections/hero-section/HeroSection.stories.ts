import type { Meta, StoryObj } from '@storybook/vue3-vite';

import HeroSection from './HeroSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/HeroSection',
  component: HeroSection,
  tags: ['autodocs'],
  argTypes: {
    category: { control: 'text' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
  },
  args: {
    category: 'Category',
    title: 'Response Title',
    subtitle: 'A short subtitle that adds context',
  },
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};

export const TitleOnly: Story = {
  args: { category: undefined, subtitle: undefined },
};

export const Empty: Story = {
  args: { category: undefined, title: undefined, subtitle: undefined },
};
