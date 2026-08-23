import { categorizeTools } from '../../helpers/tools/categorize-tools.helper.js';
import {
  TOOL_DESCRIPTIONS,
  TOOL_NAMES,
} from '../../helpers/tools/tool-registry.constants.js';

/**
 * Formats the enabled tools grouped by category for inclusion in the intent
 * selection prompt.
 */
export function formatToolCatalog(toolNames: readonly string[]): string[] {
  const groups = categorizeTools(toolNames);
  const lines: string[] = [];

  for (const [category, names] of Object.entries(groups)) {
    if (names.length === 0) continue;

    lines.push(`  ${category}:`);
    for (const name of names) {
      const description = TOOL_DESCRIPTIONS[name] ?? 'No description';
      lines.push(`    - ${name}: ${description}`);
    }
  }

  return lines;
}

/**
 * Formats a complete tool availability catalog for the intent classifier.
 * Every known tool is listed with an enabled flag so the model knows exactly
 * which concrete tool names it may emit in the tools array.
 */
export function formatToolAvailabilityCatalog(
  enabledToolNames: readonly string[],
): string[] {
  const enabledSet = new Set(enabledToolNames);
  const lines: string[] = [
    'AVAILABLE TOOLS — emit ONLY exact tool names with enabled: true in the tools array:',
  ];

  for (const name of TOOL_NAMES) {
    const enabled = enabledSet.has(name);
    const description = enabled
      ? (TOOL_DESCRIPTIONS[name] ?? 'No description')
      : 'not available';
    lines.push(
      `  - ${name}: enabled=${enabled}${enabled ? ` — ${description}` : ''}`,
    );
  }

  return lines;
}
