/** Project a stored point into the log shape. */
export function mapPointToLog(point: {
  id: string;
  text: string;
  tags: string[];
}) {
  return { id: point.id, text: point.text, tags: point.tags };
}
