import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MergeBodySection from './MergeBodySection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/MergeResponse/MergeBodySection',
  component: MergeBodySection,
  tags: ['autodocs'],
  argTypes: {
    section: { control: 'object' },
  },
} satisfies Meta<typeof MergeBodySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopicWithSnippets: Story = {
  args: {
    section: {
      topic: 'Nvidia RTX 5090',
      strengths: [
        { text: 'Brutal raster performance' },
        { text: 'Massive VRAM headroom' },
      ],
      weaknesses: [{ text: 'Power draw under full load' }],
      recommendations: [
        { text: 'Pair with a 1000W power supply' },
        { text: 'Check case clearance first' },
      ],
    },
  },
};

export const TopicWithTextOnly: Story = {
  args: {
    section: {
      topic: 'Launch timeline',
      content:
        'The card launched quietly, with third-party boards following a month later.',
    },
  },
};

export const TopicWithEverything: Story = {
  args: {
    section: {
      topic: 'RTX 5090 vs RTX 4090',
      content: 'The generational gap is real but narrower than the hype.',
      strengths: [
        { text: '~30% faster at 4K' },
        { text: 'Better ray-tracing throughput' },
      ],
      weaknesses: [
        { text: 'No memory uplift for the base model' },
        { text: 'Still a two-slot monster' },
      ],
      recommendations: [{ text: 'Only upgrade if you drive a 4K 120Hz panel' }],
    },
  },
};

export const TopicWithImageHero: Story = {
  args: {
    section: {
      topic: 'Nvidia RTX 5090 — Founders Edition',
      heroImageUrl:
        'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1200',
      heroImageAlt: 'A graphics card on a desk with RGB lighting',
      heroCaption: 'The Founders Edition cools quietly under load.',
      strengths: [{ text: 'Dual-slot cooling at 450W' }],
      weaknesses: [{ text: '16-pin power connector required' }],
    },
  },
};

export const TopicWithHeroVideo: Story = {
  args: {
    section: {
      topic: 'RTX 5090 benchmarks',
      heroVideoUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa',
      heroVideoTitle: 'RTX 5090 review — 4K gaming test',
      heroVideoCaption: 'Frame-time analysis at 4K.',
      recommendations: [{ text: 'Watch before deciding on a model' }],
    },
  },
};
