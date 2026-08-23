import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleResponse from './ArticleResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/ArticleResponse',
  component: ArticleResponse,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
  },
  args: {
    data: {
      category: 'Article',
      title: 'The Future of Search',
      subtitle: 'How LLMs are changing information retrieval',
      author: 'Jane Doe',
      publishDate: '2026-07-01',
      readTime: '5 min read',
      heroImageUrl: 'https://via.placeholder.com/800x400',
      heroImageAlt: 'Abstract search illustration',
      summary: 'A brief summary of the article.',
      sectionTitle: 'Introduction',
      sectionContent: 'Large language models enable new search interfaces.',
      quote: 'The best search is the one you do not notice.',
      galleryItems: [
        {
          imageUrl: 'https://via.placeholder.com/300x200?text=1',
          imageAlt: 'One',
        },
        {
          imageUrl: 'https://via.placeholder.com/300x200?text=2',
          imageAlt: 'Two',
        },
      ],
      cards: [
        {
          title: 'Related',
          description: 'Read more',
          url: 'https://example.com',
        },
      ],
      keyFindings: [{ text: 'Search is conversational' }],
      sources: [{ title: 'Example', url: 'https://example.com' }],
      conclusion: 'In conclusion, search will keep evolving.',
    },
  },
} satisfies Meta<typeof ArticleResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
