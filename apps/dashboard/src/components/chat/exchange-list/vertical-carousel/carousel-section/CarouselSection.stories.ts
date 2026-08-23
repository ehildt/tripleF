import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';
import { provide, ref } from 'vue';

import type { Exchange } from '@/stores/conversation';

import { CAROUSEL_SCROLL_STATE } from '../../composables/use-vertical-carousel';
import CarouselSection from './CarouselSection.vue';

function exchange(
  id: string,
  role: 'user' | 'assistant',
  content: string,
): Exchange {
  return { id, role, content, status: 'done', timestamp: Date.now() };
}

const sampleSection = {
  id: 'u1',
  user: exchange('u1', 'user', 'Hello, can you help me?'),
  assistants: [
    exchange('a1', 'assistant', 'Of course! What would you like help with?'),
  ],
};

const meta = {
  title: 'Chat/ExchangeList/VerticalCarousel/CarouselSection',
  component: CarouselSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single vertical-carousel slide: one user prompt paired with its assistant
response. Fades in/out as the carousel scrolls (blend) and resets its
internal scroll to the top when it becomes the active section.
`,
      },
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      setup() {
        provide(CAROUSEL_SCROLL_STATE, {
          scrollTop: ref(0),
          viewportHeight: ref(600),
          activeSectionIndex: ref(0),
        });
        return {};
      },
      template: '<story />',
    }),
  ],
  args: {
    section: sampleSection,
    index: 0,
    mode: 'carousel',
    highlightedIds: new Set<string>(),
    collapsedIds: new Set<string>(),
    onDelete: fn(),
    onRetry: fn(),
    onBranch: fn(),
    onToggleIncluded: fn(),
    onHoverDeleteStart: fn(),
    onHoverDeleteEnd: fn(),
  },
} satisfies Meta<typeof CarouselSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A completed user prompt with its assistant response. */
export const Default: Story = {};

/** The same section rendered as a native-scroll block (no blend/snap). */
export const Native: Story = {
  args: {
    mode: 'native',
  },
};

/** A user prompt whose assistant response is still pending. */
export const PendingAssistant: Story = {
  args: {
    section: {
      id: 'u2',
      user: exchange('u2', 'user', 'Tell me a joke'),
      assistants: [
        {
          id: 'a2',
          role: 'assistant',
          content: '',
          status: 'pending',
          timestamp: Date.now(),
        },
      ],
    },
  },
};

/** A user prompt with no assistant response yet. */
export const NoAssistant: Story = {
  args: {
    section: {
      id: 'u3',
      user: exchange('u3', 'user', 'What is the weather?'),
      assistants: [],
    },
  },
};
