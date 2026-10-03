/** Low-resolution / thumbnail / proxy domains for article/gallery images. */
export const BLOCKED_IMAGE_HOSTS = new Set([
  // Google thumbnail proxies (low-res, frequently 404 when hot-linked)
  'encrypted-tbn0.gstatic.com',
  'encrypted-tbn1.gstatic.com',
  'encrypted-tbn2.gstatic.com',
  'encrypted-tbn3.gstatic.com',
  't0.gstatic.com',
  't1.gstatic.com',
  't2.gstatic.com',
  't3.gstatic.com',
  't4.gstatic.com',
  't5.gstatic.com',
  't6.gstatic.com',
  't7.gstatic.com',
  't8.gstatic.com',
  't9.gstatic.com',
  't10.gstatic.com',
  'news.gstatic.com',
  'books.gstatic.com',
  'maps.gstatic.com',
  // Google user-content thumbnails
  'lh1.googleusercontent.com',
  'lh2.googleusercontent.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
]);
