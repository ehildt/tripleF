import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PreformattedSection from './PreformattedSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/PreformattedSection',
  component: PreformattedSection,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    content: { control: 'text' },
  },
  args: {
    title: 'Extracted Text',
    content: 'Line one\nLine two\nLine three',
  },
} satisfies Meta<typeof PreformattedSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { content: undefined },
};
