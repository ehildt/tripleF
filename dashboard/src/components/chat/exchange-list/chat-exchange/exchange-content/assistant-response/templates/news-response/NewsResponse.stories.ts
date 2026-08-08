import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, provide } from 'vue';

import { mediaPriorityKey } from '@/types/harness-response-data.model';

import NewsResponse from './NewsResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/NewsResponse',
  component: NewsResponse,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
  },
  args: {
    data: {
      category: 'Gaming',
      headline: 'No Official Nioh 3 Announcement Yet',
      deck: 'Team Ninja has not confirmed a sequel',
      lead: 'Despite ongoing fan speculation, Team Ninja has not officially announced Nioh 3. The studio has remained silent on a follow-up to the 2020 action RPG, leaving players to rely on rumors and job postings for hints.',
      byline: 'Example News Desk',
      dateline: '2026-07-11, Yokohama',
      sectionTitle: 'Current Status',
      sectionContent:
        'Team Ninja has not issued any statement confirming Nioh 3. The most recent mainline entry, Nioh 2, launched in March 2020 and received a Complete Edition the following year.\n\nIn interviews following the release of Wo Long: Fallen Dynasty and Rise of the Ronin, studio head Fumihiko Yasuda has spoken about the team\'s interest in returning to the Nioh universe, but stopped short of announcing a new installment.\n\nJob postings from Koei Tecmo have referenced "a major action RPG sequel" without naming the franchise, fueling speculation among fans. However, no teaser, trailer, or release window has been revealed.',
      heroImageUrl: '',
      heroImageAlt: '',
      heroCaption: '',
      heroVideoUrl: '',
      heroVideoCaption: '',
      videoGalleryItems: [
        {
          videoUrl: 'https://example.com/videos/nioh-hype.mp4',
          thumbnailUrl: 'https://via.placeholder.com/480x270?text=Nioh+video',
          title: 'Fans react to the Nioh 3 rumors',
        },
      ],
      galleryItems: [
        {
          imageUrl: 'https://via.placeholder.com/800x450?text=Nioh+3',
          title: 'Speculative Nioh 3 concept art',
          imageAlt: 'Concept art for a potential Nioh sequel',
        },
      ],
      keyFindings: [
        { text: 'No official Nioh 3 announcement has been made' },
        {
          text: 'Team Ninja has hinted at interest in returning to the series',
        },
        { text: 'Job postings reference an unannounced action RPG sequel' },
        { text: 'Fans are relying on rumors and speculation' },
      ],
      sources: [
        {
          title: 'Team Ninja Official',
          url: 'https://teamninja.com',
          sourceName: 'Team Ninja',
          date: '2026-07-01',
          snippet: 'No mention of Nioh 3 in recent posts.',
        },
      ],
      relatedStories: [
        {
          title: 'Nioh 2 Sales Milestone',
          url: 'https://example.com/nioh2',
          sourceName: 'Example News',
          date: '2026-07-10',
          imageUrl: 'https://via.placeholder.com/300x200?text=Nioh+2',
        },
      ],
      publishDate: '2026-07-11',
      readTime: '2 min read',
    },
  },
} satisfies Meta<typeof NewsResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    data: {},
  },
};

/** Video gallery rendered before the image gallery (videos prioritized). */
export const VideosFirst: Story = {
  render: (args) => ({
    components: { NewsResponse },
    setup() {
      provide(
        mediaPriorityKey,
        computed(() => 'videos' as const),
      );
      return { args };
    },
    template: '<NewsResponse v-bind="args" />',
  }),
};
