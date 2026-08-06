export interface ConversationMetadataImage {
  name: string;
  hash: string;
}

export interface ConversationMetadata {
  images?: ConversationMetadataImage[];
}

export interface FormQueryOptions {
  requestId: string;
  sessionId: string;
  conversationId?: string;
  roomId: string;
  stream: boolean;
  event: string;
  numCtx: string;
  think: string;
  hasNewImages?: boolean;
  conversationMetadata?: ConversationMetadata | null;
}

export function buildQueryParams(options: FormQueryOptions): URLSearchParams {
  const params = new URLSearchParams();
  params.append('requestId', options.requestId);
  if (options.sessionId) params.append('sessionId', options.sessionId);
  if (options.conversationId)
    params.append('conversationId', options.conversationId);
  if (options.roomId) params.append('roomId', options.roomId);
  params.append('stream', options.stream ? 'true' : 'false');
  params.append('event', options.event.trim());
  if (options.numCtx) params.append('numCtx', options.numCtx);
  if (options.think) params.append('think', options.think);
  if (options.hasNewImages !== undefined)
    params.append('hasNewImages', options.hasNewImages ? 'true' : 'false');
  if (options.conversationMetadata)
    params.append(
      'sessionMetadata',
      JSON.stringify(options.conversationMetadata),
    );
  return params;
}
