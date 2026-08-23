import { applySearchRecency } from './apply-search-recency.helper.js';

/**
 * Freshness outer-wrap: appends the current date to search queries when
 * the intent requires recency. Runs outside the execution-event wrapper so
 * clients display the dated query the tool actually received.
 */
export function wrapToolsWithSearchRecency(
  tools: Record<string, unknown>,
  enabled: boolean,
): Record<string, unknown> {
  if (!enabled) return tools;

  const wrapped: Record<string, unknown> = {};
  for (const [name, toolDef] of Object.entries(tools)) {
    const execute = (toolDef as { execute?: (...args: any[]) => unknown })
      ?.execute;
    if (typeof execute !== 'function') {
      wrapped[name] = toolDef;
      continue;
    }
    wrapped[name] = {
      ...(toolDef as object),
      execute: (...args: any[]) =>
        execute(applySearchRecency(name, args[0]), ...args.slice(1)),
    };
  }
  return wrapped;
}
