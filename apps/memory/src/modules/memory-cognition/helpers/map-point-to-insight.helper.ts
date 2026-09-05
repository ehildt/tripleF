/** Project a memory point into the profile-insight shape. */
export function mapPointToInsight(point: { text: string; path?: string }) {
  return {
    text: point.text,
    path: point.path,
  };
}
