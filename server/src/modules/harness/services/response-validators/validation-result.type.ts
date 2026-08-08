import type { ResponseLayout } from '../../snippets/response-layout.constant.js';

export type ValidationResult =
  | { valid: true; content: string; error?: undefined }
  | { valid: false; error: string; content?: undefined };

/** Per-call validation context shared by the validators that need it. */
export interface ValidationContext {
  /** Layouts enabled for this request (user config ∩ preset support). */
  allowedLayouts?: ResponseLayout[];
}
