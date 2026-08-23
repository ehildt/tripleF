import { computed, type Ref, ref, watch } from 'vue';

import { parseMessages } from './helpers/parse-messages.helper';
import type { MessageListItem } from './types';

export function useExpandableMessageList(
  items: Ref<
    string | MessageListItem[] | Record<string, unknown> | null | undefined
  >,
  expandAll = false,
) {
  const messages = computed<MessageListItem[]>(() =>
    parseMessages(items.value),
  );
  const expanded = ref<Set<number>>(
    expandAll ? new Set(messages.value.map((_, idx) => idx)) : new Set(),
  );

  // Keep newly added messages expanded when expandAll is active.
  watch(
    () => messages.value.length,
    (length, prevLength) => {
      if (!expandAll || prevLength == null || length <= prevLength) return;
      const next = new Set(expanded.value);
      for (let i = prevLength; i < length; i++) {
        next.add(i);
      }
      expanded.value = next;
    },
  );

  function toggle(idx: number) {
    const next = new Set(expanded.value);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    expanded.value = next;
  }

  return { messages, expanded, toggle };
}
