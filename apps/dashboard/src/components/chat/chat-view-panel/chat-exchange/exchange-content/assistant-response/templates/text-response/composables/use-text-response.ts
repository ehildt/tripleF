import { computed } from 'vue';

import { extractResponseText } from '@/stores/helpers/assistant-response/text/extract-response-text.helper';
import { renderMarkdown } from '@/utils/render-markdown/render-markdown.helper';

import type { TextResponseProps } from '../TextResponse.types';

/** Renders the response text to sanitized markdown HTML. */
export function useTextResponse(props: TextResponseProps) {
  const renderedHtml = computed(() =>
    renderMarkdown(extractResponseText(props.text ?? '')),
  );

  return { renderedHtml };
}
