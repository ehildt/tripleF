export interface GalleryItem extends Record<string, string | undefined> {
  imageUrl: string;
  imageAlt: string;
  title: string;
  caption: string;
  source?: 'local' | 'cloud';
}
