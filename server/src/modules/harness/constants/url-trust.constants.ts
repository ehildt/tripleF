/** Known low-resolution / thumbnail / proxy / asset domains for URLs. */
export const BLOCKED_URL_HOSTS = new Set([
  // Google thumbnail / static asset proxies
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
  'lh1.googleusercontent.com',
  'lh2.googleusercontent.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
]);

/** Static asset file extensions that should never appear in web page URLs. */
export const NON_PAGE_EXTENSIONS =
  /\.(js|css|json|xml|svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|ogg|mov|mkv|avi|flv|m3u8|mpd|pdf|zip|tar|gz|rar|exe|dmg|pkg|deb|rpm|woff|woff2|ttf|otf|eot)(\?.*)?$/i;
