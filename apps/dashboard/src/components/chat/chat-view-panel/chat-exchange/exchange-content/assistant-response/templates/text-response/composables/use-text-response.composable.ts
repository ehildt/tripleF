import { computed } from 'vue';

import { extractHarnessText } from '@/stores/helpers/harness/text/extract-harness-text.helper';
import { renderMarkdown } from '@/utils/render-markdown.helper';

import type { TextResponseProps } from '../TextResponse.types';

/** Renders the response text to sanitized markdown HTML. */
export function useTextResponse(props: TextResponseProps) {
  const renderedHtml = computed(() =>
    renderMarkdown(extractHarnessText(props.text ?? '')),
  );

  return { renderedHtml };
}
