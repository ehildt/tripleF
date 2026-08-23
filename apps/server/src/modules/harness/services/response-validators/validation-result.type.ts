export type ValidationResult =
  | { valid: true; content: string; error?: undefined }
  | { valid: false; error: string; content?: undefined };
