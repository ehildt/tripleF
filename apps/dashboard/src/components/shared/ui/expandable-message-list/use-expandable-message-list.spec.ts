import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useExpandableMessageList } from './use-expandable-message-list';

describe('useExpandableMessageList', () => {
  it('parses an array of messages', () => {
    const items = ref([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ]);
    const { messages } = useExpandableMessageList(items);
    expect(messages.value).toHaveLength(2);
  });

  it('starts with no expanded items', () => {
    const items = ref([{ role: 'user', content: 'hello' }]);
    const { expanded } = useExpandableMessageList(items);
    expect(expanded.value.size).toBe(0);
  });

  it('starts with all items expanded when expandAll is true', () => {
    const items = ref([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ]);
    const { expanded } = useExpandableMessageList(items, true);
    expect(expanded.value.size).toBe(2);
  });

  it('toggles item expansion', () => {
    const items = ref([{ role: 'user', content: 'hello' }]);
    const { expanded, toggle } = useExpandableMessageList(items);

    toggle(0);
    expect(expanded.value.has(0)).toBe(true);

    toggle(0);
    expect(expanded.value.has(0)).toBe(false);
  });
});
