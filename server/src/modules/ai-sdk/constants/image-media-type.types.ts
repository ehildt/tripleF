import type { ImageMediaType } from './image-media-type.constants.js';

export type MediaTypeSignature = readonly (number | null)[];

export type ImageMediaTypeSignatures = {
  [key in ImageMediaType]: MediaTypeSignature;
};
