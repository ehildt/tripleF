export interface MediaUrlValidatorOptions {
  enabled?: boolean;
  timeoutMs?: number;
  maxRedirects?: number;
  concurrency?: number;
  /** When true, image URLs are fully pinged and dimension-checked. */
  checkImageDimensions?: boolean;
  minWidth?: number;
  minHeight?: number;
  /** Maximum bytes to download when checking image dimensions. */
  maxProbeBytes?: number;
}

/** Structural view of an axios response — avoids a direct axios dependency. */
export type HttpResponse = {
  status: number;
  headers: Record<string, unknown>;
  data: unknown;
  request?: { res?: { responseUrl?: string } };
};
