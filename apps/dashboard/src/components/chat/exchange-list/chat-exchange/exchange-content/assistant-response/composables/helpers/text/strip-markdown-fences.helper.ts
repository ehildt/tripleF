export function stripMarkdownFences(text: string): string {
  let result = text;

  if (result.toLowerCase().startsWith('```json')) {
    result = result.slice(7);
  } else if (result.startsWith('```')) {
    result = result.slice(3);
  }

  if (result.endsWith('```')) {
    result = result.slice(0, -3);
  }

  return result.trim();
}
