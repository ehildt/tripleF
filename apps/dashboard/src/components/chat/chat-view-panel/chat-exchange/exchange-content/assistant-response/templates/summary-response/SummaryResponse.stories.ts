import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SummaryResponse from './SummaryResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/SummaryResponse',
  component: SummaryResponse,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
  },
  args: {
    data: {
      category: 'Recap',
      title: 'Summary of our discussion',
      subtitle: 'Key takeaways',
      summary:
        'We discussed Neverness to Everness (NTE), an urban open-world RPG by Hotta Studio with a global release on April 29, 2026.\n\nWe then looked at Wuthering Waves, a free-to-play open-world action RPG developed by Kuro Games that was released on May 23, 2024.',
      keyFindings: [
        {
          text: 'NTE is developed by Hotta Studio and launches April 29, 2026',
        },
        {
          text: 'Wuthering Waves is developed by Kuro Games and is already live',
        },
        { text: 'Both are open-world action RPGs' },
      ],
      sources: [],
    },
  },
} satisfies Meta<typeof SummaryResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMedia: Story = {
  args: {
    data: {
      category: 'Recap',
      title: 'Summary with media',
      subtitle: 'Key takeaways plus images and video',
      summary:
        'We discussed Neverness to Everness (NTE) and Wuthering Waves. Both are open-world action RPGs.',
      keyFindings: [
        { text: 'NTE launches April 29, 2026' },
        { text: 'Wuthering Waves released May 23, 2024' },
      ],
      heroImageUrl: 'https://placehold.co/600x400?text=NTE',
      heroImageAlt: 'Neverness to Everness key art',
      heroCaption: 'Promotional artwork for NTE.',
      galleryTitle: 'Screenshots',
      galleryItems: [
        {
          imageUrl: 'https://placehold.co/300x200?text=Screenshot+1',
          imageAlt: 'Screenshot 1',
          title: 'Screenshot 1',
          caption: 'Gameplay screenshot',
        },
        {
          imageUrl: 'https://placehold.co/300x200?text=Screenshot+2',
          imageAlt: 'Screenshot 2',
          title: 'Screenshot 2',
          caption: 'Another angle',
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
