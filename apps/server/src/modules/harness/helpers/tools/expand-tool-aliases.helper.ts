import { categorizeTools } from '@triplef/agent/schemas';

/**
 * Expand category aliases (e.g. "imageSearch") returned by the intent
 * classifier into the concrete enabled tool names. Valid concrete tool names
 * are kept as-is. Unknown names are dropped.
 */
export function expandToolAliases(
  rawTools: readonly string[],
  enabledToolNames: readonly string[],
): string[] {
  const enabledSet = new Set(enabledToolNames);
  const categories = categorizeTools(enabledToolNames);
  const expanded = new Set<string>();

  for (const tool of rawTools) {
    if (enabledSet.has(tool)) {
      expanded.add(tool);
      continue;
    }

    const categoryTools = categories[tool];
    if (categoryTools) {
      for (const concrete of categoryTools) {
        expanded.add(concrete);
      }
    }
  }

  return [...expanded];
}
