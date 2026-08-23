import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { Mock } from 'vitest';
import { ref } from 'vue';

import { sanitizeHtml } from '@/utils/sanitize-html.helper';

import ExpandableMessageListBody from './expandable-message-list-body/ExpandableMessageListBody.vue';
import ExpandableMessageList from './ExpandableMessageList.vue';

const conversation = [
  {
    role: 'user',
    content:
      'What is the difference between supervised and unsupervised learning?',
  },
  {
    role: 'assistant',
    content:
      'Supervised learning uses labeled training data where each example has a known output, allowing the model to learn a mapping from inputs to outputs. Common tasks include classification and regression. Unsupervised learning, on the other hand, works with unlabeled data and must find patterns or structure on its own — clustering and dimensionality reduction are typical examples.\n\nThe key distinction is the presence of labels during training. Supervised methods require ground-truth annotations, while unsupervised methods discover hidden structures without any prior knowledge of what the output should look like.',
  },
  {
    role: 'user',
    content: 'Can you give a real-world example of each?',
  },
  {
    role: 'assistant',
    content:
      'Sure. For supervised learning, a classic example is spam detection: you train a classifier on thousands of emails that have already been labeled as "spam" or "not spam" — the model learns to associate certain words and patterns with each category.\n\nFor unsupervised learning, consider customer segmentation in e-commerce. Given purchase histories for millions of customers with no predefined segments, a clustering algorithm can group customers by their buying behavior — identifying bargain hunters, luxury shoppers, seasonal buyers, and so on — without any segment labels being provided upfront.\n\nBoth approaches are widely used, and modern systems often combine them in a semi-supervised or self-supervised setup.',
  },
];

const meta = {
  title: 'Shared UI/ExpandableMessageList',
  component: ExpandableMessageList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A collapsible message list that displays an array of role/content message pairs.

- Parses string, object, or array input via \`parseMessages\`.  
- Each message can be expanded/collapsed via the chevron toggle when a \`#body\` slot is provided.  
- Clicking anywhere on the message header (role label or preview text) fires \`onClick\` — useful for scroll-to or selection actions.  
- Heading is provided via the \`#heading\` slot — no default heading is rendered.  
- Body content is provided via the scoped \`#body\` slot — receives \`{ message, index }\`.  
        `,
      },
    },
  },
  argTypes: {
    items: { control: 'object' },
    renderHtml: { control: false },
    onClick: { control: false },
  },
  args: {
    items: conversation,
    renderHtml: (content: string) => sanitizeHtml(content),
    onClick: fn(),
  },
  render: (args: any) => ({
    components: { ExpandableMessageList, ExpandableMessageListBody },
    setup() {
      const items = ref(args.items);
      return { args, items };
    },
    template: `
      <ExpandableMessageList :items="items" :render-html="args.renderHtml" :on-click="args.onClick">
        <template #body="{ message }">
          <ExpandableMessageListBody :html="args.renderHtml ? args.renderHtml(message.content) : message.content" />
        </template>
      </ExpandableMessageList>
    `,
  }),
} satisfies Meta<typeof ExpandableMessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Multiple messages with expand/collapse toggles. Click `[+]` to reveal the full assistant response. No heading is shown by default.',
      },
    },
  },
};

export const WithHeading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A heading is provided via the `#heading` slot — useful when the list needs a title like "Conversation History" or "Request Prompt".',
      },
    },
  },
  render: (args: any) => ({
    components: { ExpandableMessageList, ExpandableMessageListBody },
    setup() {
      const items = ref(args.items);
      return { args, items };
    },
    template: `
      <ExpandableMessageList :items="items" :render-html="args.renderHtml" :on-click="args.onClick">
        <template #heading>
          <h4 class="text-[10px] font-mono font-bold uppercase tracking-wider text-tab-debug">Conversation History</h4>
        </template>
        <template #body="{ message }">
          <ExpandableMessageListBody :html="args.renderHtml ? args.renderHtml(message.content) : message.content" />
        </template>
      </ExpandableMessageList>
    `,
  }),
};

export const WithOnClick: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When `onClick` is provided, clicking the message header container fires the callback with the message index. The `[+]/[-]` indicator toggles expand/collapse without firing `onClick` — clicking anywhere else on the header row triggers the action.',
      },
    },
  },
  render: (args: any) => ({
    components: { ExpandableMessageList, ExpandableMessageListBody },
    setup() {
      const items = ref(args.items);
      const lastClicked = ref<number | null>(null);
      return { args, items, lastClicked };
    },
    template: `
      <div>
        <ExpandableMessageList
          :items="items"
          :render-html="args.renderHtml"
          :on-click="(idx) => lastClicked = idx"
        >
          <template #body="{ message }">
            <ExpandableMessageListBody :html="args.renderHtml ? args.renderHtml(message.content) : message.content" />
          </template>
        </ExpandableMessageList>
        <p v-if="lastClicked !== null" class="mt-2 text-xs font-mono text-fg-muted">
          Last clicked index: {{ lastClicked }}
        </p>
        <p v-else class="mt-2 text-xs font-mono text-fg-muted">
          Click a message preview to select it
        </p>
      </div>
    `,
  }),
};

export const HeaderOnly: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When no `#body` slot is provided, only the message headers are rendered — the body area is hidden entirely and no expand/collapse toggle is shown.',
      },
    },
  },
  render: (args: any) => ({
    components: { ExpandableMessageList },
    setup() {
      const items = ref(args.items);
      return { args, items };
    },
    template: `
      <ExpandableMessageList :items="items" :render-html="args.renderHtml" :on-click="args.onClick">
        <template #heading>
          <h4 class="text-[10px] font-mono font-bold uppercase tracking-wider text-tab-debug">Header Only</h4>
        </template>
      </ExpandableMessageList>
    `,
  }),
};

export const LongMessage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A short user message with a long assistant response — verifies scrolling behaviour when content exceeds the max-height threshold.',
      },
    },
  },
  args: {
    items: [
      {
        role: 'user',
        content:
          'Explain how a token bucket rate limiter works and show me a Python implementation.',
      },
      {
        role: 'assistant',
        content: [
          '<p style="margin:0 0 8px 0;line-height:1.5">A token bucket rate limiter is one of the most elegant and widely used algorithms for controlling the rate of requests in distributed systems. The core idea is simple: you have a bucket that holds tokens, a fixed rate at which tokens are added to the bucket, and a maximum capacity that the bucket can hold. Each request consumes one token from the bucket. If the bucket is empty, the request is denied or queued.</p>',

          '<p style="margin:0 0 8px 0;line-height:1.5">The beauty of this algorithm is that it naturally handles bursts. If the bucket has capacity for 100 tokens and tokens are added at 10 per second, then after 10 seconds of inactivity the bucket is full and a burst of up to 100 requests can pass through immediately. After the burst, requests are throttled back to the steady-state rate of 10 per second as the bucket refills.</p>',

          '<p style="margin:0 0 8px 0;line-height:1.5">Here is the core logic expressed in Python:</p>',

          '<pre style="background:var(--color-bg-secondary);border:1px solid var(--color-divider);border-left:3px solid var(--color-tab-debug);border-radius:4px;padding:12px;margin:0 0 8px 0;overflow-x:auto"><code style="font-size:0.7rem;line-height:1.6;color:var(--color-fg-secondary)">import time\n\nclass TokenBucket:\n    def __init__(self, rate, capacity):\n        self.rate = rate\n        self.capacity = capacity\n        self.tokens = capacity\n        self.last_refill = time.monotonic()\n\n    def _refill(self):\n        now = time.monotonic()\n        elapsed = now - self.last_refill\n        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)\n        self.last_refill = now\n\n    def consume(self, tokens=1):\n        self._refill()\n        if self.tokens >= tokens:\n            self.tokens -= tokens\n            return True\n        return False</code></pre>',

          '<p style="margin:0 0 8px 0;line-height:1.5">The <b style="color:var(--color-accent-primary)">_refill</b> method calculates how many tokens should have been added since the last check based on the elapsed time and the refill rate. Using <b style="color:var(--color-accent-primary)">time.monotonic</b> ensures the clock is monotonic and will not be affected by system time adjustments. The <b style="color:var(--color-accent-primary)">consume</b> method atomically refills and then checks if enough tokens are available, which avoids the common bug of checking availability separately from consuming.</p>',

          '<p style="margin:0 0 8px 0;line-height:1.5">For production use you would want thread-safety with a <b style="color:var(--color-accent-primary)">threading.Lock</b>, configurable burst windows, and potentially a separate token count for different clients or API keys. You might also want to implement a sliding window variant that uses the same algorithm but resets the refill timestamp when the bucket is full to prevent token hoarding across long idle periods.</p>',

          '<p style="margin:0;line-height:1.5">Distributed rate limiting adds another layer of complexity. You can use Redis with Lua scripting to atomically check and consume tokens across multiple application instances. The Redis approach uses <b style="color:var(--color-accent-primary)">TTL</b> to auto-expire keys for inactive clients and <b style="color:var(--color-accent-primary)">INCR</b> with expiration for simple fixed-window counters, though the token bucket approach gives much smoother rate enforcement with fewer edge cases around window boundaries.</p>',
        ].join(''),
      },
    ],
  },
};
export const SingleMessage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A single message — useful for simple message inputs or one-shot conversations.',
      },
    },
  },
  args: {
    items: [
      {
        role: 'user',
        content: 'Translate "hello" to French, Spanish, and German.',
      },
    ],
  },
};

export const SystemRole: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Messages with various roles — `system`, `user`, `assistant` — each rendered with their role label as uppercase text.',
      },
    },
  },
  args: {
    items: [
      {
        role: 'system',
        content: 'You are a helpful assistant that speaks like a pirate.',
      },
      { role: 'user', content: 'What is the capital of France?' },
      {
        role: 'assistant',
        content:
          'Arrr, the capital of France be Paris, me hearty! A fine city o’ lights, baguettes, and the mighty Eiffel Tower.',
      },
    ],
  },
};

export const JSONStringInput: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The items can be a JSON string — the component parses it into messages internally.',
      },
    },
  },
  args: {
    items: JSON.stringify([
      { role: 'system', content: 'You are a helpful coding assistant.' },
      {
        role: 'user',
        content:
          'Write a Python function to check if a string is a palindrome.',
      },
    ]),
  },
};

export const ObjectWithContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The items can be an object with a nested `content` array — compatible with some API response formats that wrap messages in a structured envelope.',
      },
    },
  },
  args: {
    items: {
      content: [
        {
          role: 'user',
          content: 'Explain the difference between TCP and UDP.',
        },
        {
          role: 'assistant',
          content:
            'TCP (Transmission Control Protocol) is connection-oriented and guarantees reliable, ordered delivery of data through acknowledgments and retransmission. It is ideal for applications where data integrity matters, such as web browsing, email, and file transfers.\n\nUDP (User Datagram Protocol), by contrast, is connectionless and provides no guarantees — packets may arrive out of order or be lost entirely. This makes UDP suitable for real-time applications like video streaming, online gaming, and DNS lookups where speed matters more than perfect accuracy.',
        },
      ],
    },
  },
};

export const WithoutSanitization: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Without `renderHtml` — content is rendered as-is via `v-html`. The consumer is responsible for sanitization when dealing with untrusted content.',
      },
    },
  },
  args: {
    renderHtml: undefined,
  },
};

export const CustomBody: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The `#body` slot can render custom content instead of `ExpandableMessageListBody`. Here each message body is rendered as a plain code block without the standard body styling.',
      },
    },
  },
  render: (args: any) => ({
    components: { ExpandableMessageList },
    setup() {
      const items = ref(args.items);
      return { args, items };
    },
    template: `
      <ExpandableMessageList :items="items" :on-click="args.onClick">
        <template #body="{ message }">
          <pre class="px-2 py-1 text-[10px] font-mono text-fg-muted/70 overflow-x-auto">{{ message.content }}</pre>
        </template>
      </ExpandableMessageList>
    `,
  }),
};

export const InteractionTest: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Verifies the split-click behavior: clicking `[+]` toggles expand/collapse without firing `onClick`; clicking the header container (role label or preview text) fires `onClick` without toggling.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const onClick = args.onClick as Mock;
    onClick.mockClear();

    const toggles = canvas.getAllByTestId('expandable-message-list-toggle');
    await expect(toggles[0]).toBeInTheDocument();

    await userEvent.click(toggles[0]);
    await expect(onClick).not.toHaveBeenCalled();

    const body = canvas.getByText(
      'What is the difference between supervised and unsupervised learning?',
    );
    await expect(body).toBeInTheDocument();

    await userEvent.click(body);
    await expect(onClick).toHaveBeenCalledWith(0);
    onClick.mockClear();

    await userEvent.click(canvas.getByText('user'));
    await expect(onClick).toHaveBeenCalledWith(0);

    await userEvent.click(toggles[0]);
    await expect(onClick).toHaveBeenCalledTimes(0);
  },
};
