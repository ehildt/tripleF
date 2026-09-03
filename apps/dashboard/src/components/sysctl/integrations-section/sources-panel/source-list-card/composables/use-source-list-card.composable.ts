import { nextTick, ref, watch } from 'vue';

import { parseSourceList } from '../../helpers/parse-source-list.helper';
import type { SourceListCardProps } from '../SourceListCard.types';

const MAX_INPUT_HEIGHT = 256;

/**
 * Owns one source-list card's textarea: the editable draft (synced when the
 * list prop changes), the grow-with-content auto-resize (capped at
 * MAX_INPUT_HEIGHT), and the parse-on-change commit.
 */
export function useSourceListCard(
  props: SourceListCardProps,
  emit: (event: 'change', list: string[]) => void,
) {
  const draft = ref('');
  const textarea = ref<HTMLTextAreaElement>();

  watch(
    () => props.list,
    async (list) => {
      draft.value = (list ?? []).join('\n');
      await nextTick();
      resize(textarea.value);
    },
    { immediate: true },
  );

  /** Grow the textarea with its content until it hits max-height, then scroll. */
  function resize(el: HTMLTextAreaElement | undefined) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }

  function save() {
    emit('change', parseSourceList(draft.value));
  }

  return { draft, textarea, resize, save };
}
