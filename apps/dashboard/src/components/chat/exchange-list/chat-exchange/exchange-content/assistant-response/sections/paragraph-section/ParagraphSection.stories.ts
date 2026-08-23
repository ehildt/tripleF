import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ParagraphSection from './ParagraphSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/ParagraphSection',
  component: ParagraphSection,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    content: { control: 'text' },
  },
  args: {
    title: 'Section Title',
    content: 'This is the section content rendered as plain text.',
  },
} satisfies Meta<typeof ParagraphSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTitle: Story = {};

export const WithoutTitle: Story = {
  args: { title: undefined },
};

export const Empty: Story = {
  args: { content: undefined },
};
