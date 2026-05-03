import type { Ref } from 'vue';

export interface ConversationMetadataImage {
  name: string;
  hash: string;
}

export interface ConversationMetadata {
  images?: ConversationMetadataImage[];
}

export interface FormQueryOptions {
  requestId: Ref<string>;
  sessionId: Ref<string>;
  conversationId?: Ref<string>;
  roomId: Ref<string>;
  stream: Ref<boolean>;
  event: Ref<string>;
  numCtx: Ref<string>;
  think: Ref<string>;
  hasNewImages?: Ref<boolean>;
  conversationMetadata?: Ref<ConversationMetadata | null>;
}

export function buildQueryParams(options: FormQueryOptions): URLSearchParams {
  const params = new URLSearchParams();
  params.append('requestId', options.requestId.value);
  if (options.sessionId.value)
    params.append('sessionId', options.sessionId.value);
  if (options.conversationId?.value)
    params.append('conversationId', options.conversationId.value);
  if (options.roomId.value) params.append('roomId', options.roomId.value);
  params.append('stream', options.stream.value ? 'true' : 'false');
  params.append('event', options.event.value.trim());
  if (options.numCtx.value) params.append('numCtx', options.numCtx.value);
  if (options.think.value) params.append('think', options.think.value);
  if (options.hasNewImages?.value !== undefined)
    params.append(
      'hasNewImages',
      options.hasNewImages.value ? 'true' : 'false',
    );
  if (options.conversationMetadata?.value)
    params.append(
      'sessionMetadata',
      JSON.stringify(options.conversationMetadata.value),
    );
  return params;
}
