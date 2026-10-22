/** Render a tool result as a single readable line for the write-job prompt. */
export function stringifyToolResult(result: unknown): string {
  return typeof result === 'string' ? result : JSON.stringify(result ?? '');
}
