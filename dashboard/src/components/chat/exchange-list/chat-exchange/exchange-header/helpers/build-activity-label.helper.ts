import {
  type ActiveToolCall,
  buildToolActivityLabel,
} from '../../exchange-content/exchange-activity/helpers/build-tool-activity-label.helper';

/**
 * Resolve the single activity label shown next to the cancel icon while an
 * assistant exchange is pending. Thinking takes precedence: once the model
 * streams reasoning, the label reads "thinking.." regardless of tool or step
 * activity. Otherwise parallel tool calls collapse into one grouped label,
 * falling back to the current pipeline step status.
 */
export function buildActivityLabel(params: {
  reasoning?: string;
  toolCalls?: ActiveToolCall[];
  activity?: string;
}): string {
  if (params.reasoning?.trim()) return 'Consolidating everything..';

  const toolLabel = buildToolActivityLabel(params.toolCalls ?? []);
  if (toolLabel) return toolLabel;

  return params.activity ?? '';
}
