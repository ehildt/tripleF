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
      'Free-form responses use clear block spacing, a readable hierarchy, and a softer prose color.',
      '',
      'Text with **bold**, *italic*, `inline code` and a bare URL: https://example.com',
      '',
      '### Lists and quotations',
      '',
      '- First item with enough room to read comfortably',
      '- Second item with an accent marker',
      '',
      '> Good formatting guides the reader.',
      '>',
      '> It gives every idea a clear place without changing the underlying text.',
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
