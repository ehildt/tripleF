/**
 * Regression test: ExpandableMessageList story must not horizontally overflow the
 * StoryContainer. The LongMessage story contains a wide `<pre>` block
 * with code samples that can push the message beyond the container
 * width if the container does not constrain its children.
 */
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import { sanitizeHtml } from '@/utils/sanitize-html.helper';

import StoryContainer from '../../../../../.storybook/StoryContainer.vue';
import ExpandableMessageListBody from './expandable-message-list-body/ExpandableMessageListBody.vue';
import ExpandableMessageList from './ExpandableMessageList.vue';

const longMessageItems = [
  {
    role: 'user',
    content: 'Explain how a token bucket rate limiter works.',
  },
  {
    role: 'assistant',
    content: [
      '<p style="margin:0 0 8px 0;line-height:1.5">A token bucket rate limiter.</p>',
      '<pre style="background:var(--color-bg-secondary);border:1px solid var(--color-divider);overflow-x:auto;padding:12px;margin:0 0 8px 0"><code style="font-size:0.7rem;line-height:1.6">import time\n\nclass TokenBucket:\n    def __init__(self, rate, capacity, tokens=1):\n        # A long line that should be wrapped/scrollable, not push the container\n        self.rate = rate\n        self.capacity = capacity\n        self.tokens = capacity\n        self.last_refill = time.monotonic()\u003c/code\u003e</pre\u003e',
    ].join(''),
  },
];

async function mountExpandableMessageListInStoryContainer() {
  const LongList = defineComponent({
    components: { ExpandableMessageList, ExpandableMessageListBody },
    setup() {
      return () =>
        h(
          ExpandableMessageList,
          {
            items: longMessageItems,
            renderHtml: (content: string) => sanitizeHtml(content),
          },
          {
            body: ({ message }: { message: { content: string } }) =>
              h(ExpandableMessageListBody, {
                html: sanitizeHtml(message.content),
              }),
          },
        );
    },
  });

  const wrapper = mount(StoryContainer, {
    slots: { default: () => h(LongList) },
  });
  await nextTick();
  return wrapper;
}

describe('ExpandableMessageList story layout', () => {
  beforeEach(() => {
    localStorage.clear();
    // Provide a deterministic container width for the test.
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 800;
      },
    });
  });

  it('ExpandableMessageList (LongMessage) does not overflow the StoryContainer horizontally', async () => {
    const wrapper = await mountExpandableMessageListInStoryContainer();
    const container = wrapper.element as HTMLElement;

    // The container is 800px wide (mocked). Children should not exceed it.
    const list = container.querySelector(
      '.expandable-message-list',
    ) as HTMLElement;
    expect(list).toBeTruthy();
    expect(list.scrollWidth).toBeLessThanOrEqual(container.clientWidth + 1);

    // Each message must also fit within the container.
    const messages = container.querySelectorAll(
      '.expandable-message-list__item',
    );
    expect(messages.length).toBeGreaterThan(0);
    for (const m of Array.from(messages)) {
      const msg = m as HTMLElement;
      expect(msg.scrollWidth).toBeLessThanOrEqual(container.clientWidth + 1);
    }
  });
});
