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
  | 'assistant-response'
  | 'user-request'
  | 'error'
  | 'plain';
