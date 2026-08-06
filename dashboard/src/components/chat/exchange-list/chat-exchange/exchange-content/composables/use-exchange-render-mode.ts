import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import type { Exchange } from '@/stores/conversation';

import { buildMessageClasses } from '../../helpers/build-message-classes.helper';

export interface ExchangeRenderFlags {
  isUser: boolean;
  isError: boolean;
  isPending: boolean;
  isStreaming: boolean;
  isHighlighted: boolean;
}

/** What the exchange body renders, in template branch precedence order. */
export type ExchangeRenderMode =
  | 'reasoning'
  | 'pending-empty'
  | 'streaming-skeleton'
  | 'assistant-response'
  | 'user-request'
  | 'error'
  | 'plain';

/**
 * Derives what an exchange body renders from the exchange and its status
 * flags: which divider variant sits above it, which content branch the body
 * shows, the container classes, and whether the streaming cursor is visible.
 */
export function useExchangeRenderMode(
  exchange: MaybeRefOrGetter<Exchange>,
  flags: MaybeRefOrGetter<ExchangeRenderFlags>,
) {
  const dividerVariant = computed<'user' | 'error' | 'assistant'>(() => {
    const { isUser, isError } = toValue(flags);
    if (isError) return 'error';
    return isUser ? 'user' : 'assistant';
  });

  const renderMode = computed<ExchangeRenderMode>(() => {
    const current = toValue(exchange);
    const { isUser, isError, isPending, isStreaming } = toValue(flags);

    if (isPending && !current.content) {
      return current.reasoning ? 'reasoning' : 'pending-empty';
    }

    const hasHarnessTemplate = !!current.harnessTemplate;
    const isAssistantResponse =
      hasHarnessTemplate &&
      (current.harnessData !== undefined || current.text !== undefined);
    const isAwaitingFirstHarnessData =
      isStreaming &&
      hasHarnessTemplate &&
      !current.harnessData &&
      current.harnessTemplate !== 'text';

    if (isAwaitingFirstHarnessData) return 'streaming-skeleton';
    if (isAssistantResponse) return 'assistant-response';
    if (isUser) return 'user-request';
    if (isError) return 'error';
    return 'plain';
  });

  // User prompts style their own text bubble inside UserRequest; the image
  // tiles above it must not sit inside the colored box. `content-body` is
  // the semantic hook class the light mode uses for its code overrides.
  const containerClasses = computed(() => {
    const { isUser, isError, isHighlighted } = toValue(flags);
    if (!isUser || isError) {
      return buildMessageClasses({ isUser, isError, isHighlighted });
    }
    const highlightClass = isHighlighted ? 'exchange-message--highlighted' : '';
    return `exchange-user-wrap content-body ${highlightClass}`.trim();
  });

  const showStreamingCursor = computed(() => toValue(flags).isStreaming);

  return { dividerVariant, renderMode, containerClasses, showStreamingCursor };
}
