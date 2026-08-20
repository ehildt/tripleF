export interface AsyncImageProps {
  /** Image URL — the caller encodes it (e.g. `encodeURI`) before passing. */
  src: string;
  /** Alt text; pass an empty string for decorative posters. */
  alt?: string;
  /**
   * Eager + high-priority loading for LCP candidates (hero images).
   * Defaults to `false` (lazy).
   */
  eager?: boolean;
  /** Object-fit mode. Defaults to `cover`. */
  fit?: 'cover' | 'contain';
  /**
   * Render the "Image unavailable" overlay when the fetch fails.
   * Defaults to `true`; disable for tiny thumbs that settle on an empty box.
   */
  showErrorLabel?: boolean;
}
