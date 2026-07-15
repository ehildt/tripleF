import {
  buildLanguageRule,
  COMPACT_INSTRUCTIONS,
  FINAL_REMINDER,
  IMAGE_TASK_RULE,
  ITEM_SHAPES,
  JSON_RULES,
  MEDIA_COUNTS,
  MEDIA_RULES,
  MULTIMODAL_POLICY,
  OUTPUT_CONTRACT,
  PRECEDENCE_RULES,
  SEARCH_POLICY,
  SECURITY_RULES,
  SOURCE_TRUTH_RULES,
  TOOL_RESULTS_RULES,
} from './shared/index.js';

export function buildContentSystemPrompt(params: {
  template: string;
  instructions?: string;
  tools: string[];
  placeholders: string[];
  isImageTask: boolean;
  contextSummary?: string;
  language?: string;
}): string {
  const isTextTemplate = params.template === 'text';
  const isCompactTemplate = params.template === 'compact';
  const isFreeForm = isTextTemplate || isCompactTemplate;
  const language = params.language ?? 'en';

  const sections: string[] = [
    OUTPUT_CONTRACT,
    buildLanguageRule(language),
    SECURITY_RULES,
    PRECEDENCE_RULES,
  ];

  if (params.isImageTask) {
    sections.push(MULTIMODAL_POLICY, SEARCH_POLICY, IMAGE_TASK_RULE);
  }

  sections.push(
    `TEMPLATE: ${params.template}`,
    isFreeForm
      ? 'Return plain text.'
      : `Return exactly these top-level keys: ${params.placeholders.join(', ') || '(none)'}.`,
  );

  if (!isFreeForm) {
    sections.push(JSON_RULES, ITEM_SHAPES);
  }

  if (params.instructions) {
    sections.push(`EXECUTION INSTRUCTIONS\n${params.instructions}`);
  }

  if (isCompactTemplate) {
    sections.push(COMPACT_INSTRUCTIONS);
  }

  sections.push(
    'DATA SOURCES',
    params.tools.length === 0
      ? 'No external results are available. Use only the conversation.'
      : 'Retrieved articles and media are authoritative. Prefer them over internal knowledge. Never fabricate facts, citations, or URLs.',
    SOURCE_TRUTH_RULES,
    TOOL_RESULTS_RULES,
  );

  if (!isFreeForm) {
    sections.push(MEDIA_RULES, MEDIA_COUNTS);
  }

  if (params.contextSummary) {
    sections.push(
      `CONTEXT SUMMARY\n${params.contextSummary}\nUse only to resolve references from the latest message.`,
    );
  }

  if (!isFreeForm) {
    sections.push(FINAL_REMINDER);
  }

  return sections.filter(Boolean).join('\n\n');
}
