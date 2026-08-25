export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export type MediaTypeSignature = readonly (number | null)[];

export type ImageMediaTypeSignatures = {
  [key in ImageMediaType]: MediaTypeSignature;
};
