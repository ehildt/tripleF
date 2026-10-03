import type { UploadedDocument, UploadedImage } from '@/stores/conversation';

/** One prepared harness request: everything the transport needs to POST it. */
export interface PostHarnessRequestOptions {
  /** Model name; also sent as the routing header. */
  model: string;
  /** Client request id used to correlate the socket response. */
  requestId: string;
  /** Session id (the store conversation id); empty when none is active. */
  sid: string;
  /** Socket room the response is delivered to. */
  room: string;
  /** Socket event the response is delivered on. */
  event: string;
  /** Query string appended to the harness endpoint. */
  params: URLSearchParams;
  /** Multipart body carrying the prompt and any new files. */
  formData: FormData;
  /** Whether the response should stream. */
  stream: boolean;
  /** Context window size sent with the prompt. */
  numCtx: string;
  /** Registered images the prompt references. */
  referencedImages: UploadedImage[];
  /** Newly uploaded documents attached to the prompt. */
  newDocuments: UploadedDocument[];
  /** Conversation id the prompt belongs to. */
  conversationId: string;
}
