import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleConclusionSection from './ArticleConclusionSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/ArticleConclusionSection',
  component: ArticleConclusionSection,
  tags: ['autodocs'],
  argTypes: {
    conclusion: { control: 'text' },
  },
  args: {
    conclusion: 'This concludes the article.',
  },
} satisfies Meta<typeof ArticleConclusionSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { conclusion: undefined },
};
