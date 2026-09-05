/**
 * Strip a model's reasoning markup from assistant content before the text
 * feeds persistence consumers (memory vectorize/profile enqueues).
 *
 * Providers that split reasoning into dedicated stream events leave
 * `content` clean — but a model may instead inline its thinking as
 * `<think>…</think>` markup inside the content stream (think flag off,
 * provider without a separate reasoning field, mid-request abort). The chat
 * UI renders that stream to the user; memory must never store it — the
 * zero-facts vectorize fallback stores the whole assistant text verbatim.
 *
 * Handles the three shapes in the wild: closed blocks anywhere, an
 * unclosed trailing block (abort mid-thought), and a dangling preamble
 * that ends in `</think>` (the opening tag lost upstream). Idempotent,
 * never throws; mirrors the stripping `parseLlmJson` does for JSON output.
 */
export function stripThinking(text: string | undefined): string | undefined {
  if (!text) return text;
  const stripped = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/i, '')
    .replace(/^[\s\S]*?<\/think>/i, '')
    .trim();
  return stripped || undefined;
}
