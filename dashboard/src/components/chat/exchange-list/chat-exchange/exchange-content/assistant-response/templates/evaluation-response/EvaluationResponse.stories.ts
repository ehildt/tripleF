import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EvaluationResponse from './EvaluationResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/EvaluationResponse',
  component: EvaluationResponse,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
  },
  args: {
    data: {
      category: 'Review',
      title: 'Evaluation: Neverness to Everness',
      subtitle: 'Early assessment based on announced details',
      subject: 'Neverness to Everness (NTE)',
      verdict: 'Promising but wait for launch reviews',
      score: 8,
      scoreLabel: '8/10',
      reasoning:
        'NTE shows strong visual identity and open-world ambition. The main risk is whether the monetization and end-game loop will feel fair.',
      strengths: [
        { text: 'Distinct urban supernatural setting' },
        { text: 'Large-scale open world from Hotta Studio' },
        { text: 'Multi-platform global launch' },
      ],
      weaknesses: [
        { text: 'Monetization details remain unclear' },
        { text: 'Late global release compared to other regions' },
      ],
      recommendations: [
        { text: 'Wait for post-launch player reviews' },
        { text: 'Try the open beta if available' },
      ],
      sources: [],
    },
  },
} satisfies Meta<typeof EvaluationResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMedia: Story = {
  args: {
    data: {
      category: 'Review',
      title: 'Evaluation with media',
      subtitle: 'Assessment based on research',
      subject: 'Neverness to Everness (NTE)',
      verdict: 'Promising',
      score: 8,
      scoreLabel: '8/10',
      reasoning: 'Strong visual identity and open-world ambition.',
      strengths: [{ text: 'Distinct urban supernatural setting' }],
      weaknesses: [{ text: 'Monetization unclear' }],
      recommendations: [{ text: 'Wait for reviews' }],
      heroImageUrl: 'https://placehold.co/600x400?text=NTE',
      heroImageAlt: 'Neverness to Everness key art',
      heroCaption: 'Promotional artwork.',
      galleryTitle: 'Screenshots',
      galleryItems: [
        {
          imageUrl: 'https://placehold.co/300x200?text=Screenshot+1',
          imageAlt: 'Screenshot 1',
          title: 'Screenshot 1',
          caption: 'Gameplay screenshot',
        },
      ],
      videoGalleryTitle: 'Trailers',
      videoGalleryItems: [
        {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Official trailer',
          caption: 'Launch trailer',
        },
      ],
      sources: [{ title: 'Official site', url: 'https://example.com' }],
    },
  },
};
