/** Project an available video into the media allow-list shape. */
export function mapVideoToAllowed(video: { url: string; title?: string }) {
  return { videoUrl: video.url, title: video.title };
}
