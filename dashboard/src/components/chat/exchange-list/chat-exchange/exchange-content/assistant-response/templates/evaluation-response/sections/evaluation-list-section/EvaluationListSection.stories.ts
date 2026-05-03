import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EvaluationListSection from './EvaluationListSection.vue';

const meta = {
  title:
    'Chat/AssistantResponse/Templates/EvaluationResponse/EvaluationListSection',
  component: EvaluationListSection,
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
    variant: {
      control: 'select',
      options: ['strength', 'weakness', 'recommendation'],
    },
  },
} satisfies Meta<typeof EvaluationListSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Strengths: Story = {
  args: {
    title: 'Strengths',
    variant: 'strength',
    items: [
      { text: 'Impressive visuals' },
      { text: 'Strong combat mechanics' },
    ],
  },
};

export const Weaknesses: Story = {
  args: {
    title: 'Weaknesses',
    variant: 'weakness',
    items: [{ text: 'Unclear monetization' }, { text: 'Late global launch' }],
  },
};

export const Recommendations: Story = {
  args: {
    title: 'Recommendations',
    variant: 'recommendation',
    items: [
      { text: 'Wait for launch reviews' },
      { text: 'Try the beta if available' },
    ],
  },
};
