import {
  resolveToolCategory,
  type ToolCategory,
} from '../tools/resolve-tool-category.helper.js';

export type ToolExecutionEvent = {
  name: string;
  category: ToolCategory;
  query?: string;
  input?: unknown;
  status: 'start' | 'done' | 'error';
};

export type ToolExecutionEventHandler = (event: ToolExecutionEvent) => void;

/** Pull public lookup text out of a tool input for call correlation and, for
 * search categories, display. Fetched URLs correlate parallel page reads but
 * stay hidden from the label; memory inputs deliberately have no fallback. */
function extractToolQuery(input: unknown): string | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const values = input as Record<string, unknown>;
  const query = values.query ?? values.url;
  return typeof query === 'string' && query.trim() ? query.trim() : undefined;
}

/**
 * Wrap each tool's execute so start/done/error events fire exactly around
 * execution — covers both model-invoked tools and tools invoked directly
 * through the missing-tools fallback.
 */
export function wrapToolsWithExecutionEvents(
  tools: Record<string, unknown>,
  onToolEvent?: ToolExecutionEventHandler,
): Record<string, unknown> {
  if (!onToolEvent) return tools;

  const wrapped: Record<string, unknown> = {};
  for (const [name, toolDef] of Object.entries(tools)) {
    const execute = (toolDef as { execute?: (...args: any[]) => unknown })
      ?.execute;
    if (typeof execute !== 'function') {
      wrapped[name] = toolDef;
      continue;
    }
    const category = resolveToolCategory(name);
    wrapped[name] = {
      ...(toolDef as object),
      execute: async (...args: any[]) => {
        const query = extractToolQuery(args[0]);
        onToolEvent({
          name,
          category,
          query,
          input: args[0],
          status: 'start',
        });
        try {
          const result = await execute(...args);
          onToolEvent({
            name,
            category,
            query,
            input: args[0],
            status: 'done',
          });
          return result;
        } catch (error) {
          onToolEvent({
            name,
            category,
            query,
            input: args[0],
            status: 'error',
          });
          throw error;
        }
      },
    };
  }
  return wrapped;
}
