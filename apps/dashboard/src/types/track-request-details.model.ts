export interface TrackRequestDetails {
  headers?: Record<string, string>;
  body?: string;
  formData?: FormData;
  requestId?: string;
  roomId?: string;
  event?: string;
  numCtx?: string;
  stream?: boolean;
  model?: string;
  preprocessing?: string;
}
