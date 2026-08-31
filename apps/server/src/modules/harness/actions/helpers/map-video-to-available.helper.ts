/** Project a verified video into the available-media shape. */
export function mapVideoToAvailable(item: {
  videoUrl: string;
  title?: string;
}) {
  return { url: item.videoUrl, title: item.title };
}
