import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleHeroMediaSection from './ArticleHeroMediaSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/ArticleHeroMediaSection',
  component: ArticleHeroMediaSection,
  tags: ['autodocs'],
  argTypes: {
    heroImageUrl: { control: 'text' },
    heroImageAlt: { control: 'text' },
    heroCaption: { control: 'text' },
  },
  args: {
    heroImageUrl: 'https://via.placeholder.com/800x400',
    heroImageAlt: 'Hero image',
    heroCaption: 'A caption for the hero media',
  },
} satisfies Meta<typeof ArticleHeroMediaSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { heroImageUrl: undefined },
};
