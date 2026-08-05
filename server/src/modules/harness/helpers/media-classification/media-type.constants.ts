/** Content-type prefixes used to classify media URLs. */
export const IMAGE_CONTENT_TYPE_PREFIXES = ['image/'];
export const VIDEO_CONTENT_TYPE_PREFIXES = [
  'video/',
  'application/x-mpegurl',
  'application/vnd.apple.mpegurl',
];
export const HTML_CONTENT_TYPE_PREFIXES = ['text/html', 'application/xhtml'];

/** Magic-byte signatures for common image formats. */
export const IMAGE_MAGIC_BYTES: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: 'image/png' },
  { bytes: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif' },
];

/** Magic-byte signatures for common video containers. */
export const VIDEO_MAGIC_BYTES: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0x00, 0x00, 0x00], mime: 'video/mp4' },
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], mime: 'video/webm' },
  { bytes: [0x4f, 0x67, 0x67, 0x53], mime: 'video/ogg' },
];

/**
 * ISOBMFF major brands (the 4 letters after "ftyp") that identify image
 * containers rather than video: AVIF and the HEIF family.
 */
export const ISOBMFF_IMAGE_BRANDS = new Set([
  'avif',
  'avis',
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
]);
