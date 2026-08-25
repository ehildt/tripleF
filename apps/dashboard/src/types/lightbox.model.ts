export interface LightboxImage {
  url: string;
  title?: string;
  /** Upload origin carried through from gallery items: 'cloud' marks
   * server-ingested web images, which the lightbox offers to add to files. */
  source?: string;
}
