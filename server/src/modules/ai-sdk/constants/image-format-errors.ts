/** Error thrown when an image buffer does not match any known mime signature. */
export class UnsupportedImageFormatError extends Error {
  constructor() {
    super('Unsupported image format');
  }
}
