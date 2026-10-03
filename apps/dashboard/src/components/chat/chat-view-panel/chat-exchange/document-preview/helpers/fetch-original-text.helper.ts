/** Fetch and decode the original document's plain text. */
export async function fetchOriginalText(
  url: string,
): Promise<{ text: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { text: new TextDecoder().decode(await response.arrayBuffer()) };
}
