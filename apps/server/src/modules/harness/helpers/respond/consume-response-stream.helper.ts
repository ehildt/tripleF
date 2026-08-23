/**
 * Drain a chat full-stream, forwarding text/reasoning deltas and summing the
 * token usage from the finish event.
 */
export async function consumeResponseStream(
  fullStream: AsyncIterable<{
    type: string;
    text?: string;
    totalUsage?: { inputTokens?: number; outputTokens?: number };
    usage?: { inputTokens?: number; outputTokens?: number };
  }>,
  handlers: {
    onTextDelta?: (delta: string) => void;
    onReasoningDelta?: (delta: string) => void;
  },
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  let content = '';
  let inputTokens = 0;
  let outputTokens = 0;

  for await (const part of fullStream) {
    if (part.type === 'text-delta' && part.text) {
      content += part.text;
      handlers.onTextDelta?.(part.text);
    } else if (part.type === 'reasoning-delta' && part.text) {
      handlers.onReasoningDelta?.(part.text);
    } else if (part.type === 'finish') {
      const usage = part.totalUsage ?? part.usage;
      if (usage) {
        inputTokens = usage.inputTokens ?? 0;
        outputTokens = usage.outputTokens ?? 0;
      }
    }
  }

  return { content, inputTokens, outputTokens };
}
