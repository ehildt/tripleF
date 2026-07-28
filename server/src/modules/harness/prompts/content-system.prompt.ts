import type { SourcesConfig } from '../../provider-overrides/configs/sources-config.adapter.js';
import { buildContextSummarySection } from '../helpers/build-context-summary-section.helper.js';

import {
  buildLanguageRule,
  buildSourcePolicyPrompt,
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
  sources?: SourcesConfig;
}): string {
  const isTextTemplate = params.template === 'text';
  const isCompactTemplate = params.template === 'compact';
  const isFreeForm = isTextTemplate || isCompactTemplate;

  let returnDirective: string;
  if (isTextTemplate) {
    returnDirective =
      'Return free-form text. Markdown is allowed and encouraged when it improves readability.';
  } else if (isCompactTemplate) {
    returnDirective = 'Return plain text.';
  } else {
    returnDirective = `Return exactly these top-level keys: ${params.placeholders.join(', ') || '(none)'}.`;
  }

  const sections: string[] = [
    OUTPUT_CONTRACT,
    buildLanguageRule(params.language),
    SECURITY_RULES,
    PRECEDENCE_RULES,
  ];

  if (params.isImageTask) {
    sections.push(MULTIMODAL_POLICY, SEARCH_POLICY, IMAGE_TASK_RULE);
  }

  sections.push(`TEMPLATE: ${params.template}`, returnDirective);

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

  // Runtime source policy (SysCtl): preferred domains = soft rank guidance,
  // blocked domains = absolute exclusions.
  const sourcePolicy = buildSourcePolicyPrompt(params.sources);
  if (sourcePolicy) sections.push(sourcePolicy);

  if (!isFreeForm) {
    sections.push(MEDIA_RULES, MEDIA_COUNTS);
  }

  if (params.contextSummary) {
    sections.push(buildContextSummarySection(params.contextSummary));
  }

  if (!isFreeForm) {
    sections.push(FINAL_REMINDER);
  }

  return sections.filter(Boolean).join('\n\n');
}
