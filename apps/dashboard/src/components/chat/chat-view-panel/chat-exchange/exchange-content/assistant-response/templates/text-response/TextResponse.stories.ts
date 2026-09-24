import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TextResponse from './TextResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/TextResponse',
  component: TextResponse,
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
  },
  args: {
    text: 'Hello world from a streaming text response.',
  },
} satisfies Meta<typeof TextResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Markdown: Story = {
  args: {
    text: [
      '## Streaming markdown',
      '',
      'Text with **bold**, *italic*, `inline code` and a bare URL: https://example.com',
      '',
      '- First item',
      '- Second item',
      '',
      '```ts',
      'const answer: number = 42;',
      '```',
      '',
      '| Column | Value |',
      '| --- | --- |',
      '| Alpha | 1 |',
      '| Beta | 2 |',
    ].join('\n'),
  },
};

export const Empty: Story = {
  args: { text: undefined },
};
