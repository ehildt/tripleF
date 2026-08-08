export interface FetchImageBufferOptions {
  timeoutMs: number;
  /** Hard cap on the downloaded body — larger responses are rejected. */
  maxBytes?: number;
}
