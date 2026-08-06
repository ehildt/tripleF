import type { SourcesConfig } from '../../provider-overrides/configs/sources-config.adapter.js';
import { buildContextSummarySection } from '../helpers/build-context-summary-section.helper.js';

import { COMPACT_INSTRUCTIONS } from './instructions/compact.instruction.js';
import { FINAL_REMINDER } from './shared/final-reminder.prompt.js';
import { HISTORY_URLS_RULES } from './shared/history-urls.prompt.js';
import { IMAGE_TASK_RULE } from './shared/image-task-rule.prompt.js';
import { ITEM_SHAPES } from './shared/item-shapes.prompt.js';
import { JSON_RULES } from './shared/json-rules.prompt.js';
import { buildLanguageRule } from './shared/language-rule.prompt.js';
import { MEDIA_COUNTS } from './shared/media-counts.prompt.js';
import { MEDIA_RULES } from './shared/media-rules.prompt.js';
import { MULTIMODAL_POLICY } from './shared/multimodal-policy.prompt.js';
import { NOISE_RULES } from './shared/noise-rules.prompt.js';
import { OUTPUT_CONTRACT } from './shared/output-contract.prompt.js';
import { PRECEDENCE_RULES } from './shared/precedence-rules.prompt.js';
import { SEARCH_POLICY } from './shared/search-policy.prompt.js';
import { SECURITY_RULES } from './shared/security-rules.prompt.js';
import { buildSourcePolicyPrompt } from './shared/source-policy.prompt.js';
import { SOURCE_TRUTH_RULES } from './shared/source-truth.prompt.js';
import { TOOL_RESULTS_RULES } from './shared/tool-results.prompt.js';

export function buildContentSystemPrompt(params: {
  template: string;
  instructions?: string;
  tools: string[];
  requiredKeys: string[];
  optionalKeys: string[];
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
    const required = params.requiredKeys.join(', ') || '(none)';
    const optional = params.optionalKeys.join(', ') || '(none)';
    returnDirective = [
      `Return a single JSON object with these required top-level keys: ${required}.`,
      `Optional keys, include only when they add value: ${optional}.`,
      'Do not add other top-level keys — unknown keys are dropped.',
    ].join('\n');
  }

  const sections: string[] = [
    OUTPUT_CONTRACT,
    buildLanguageRule(params.language),
    SECURITY_RULES,
    PRECEDENCE_RULES,
    NOISE_RULES,
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
    sections.push(MEDIA_RULES, MEDIA_COUNTS, HISTORY_URLS_RULES);
  }

  if (params.contextSummary) {
    sections.push(buildContextSummarySection(params.contextSummary));
  }

  if (!isFreeForm) {
    sections.push(FINAL_REMINDER);
  }

  return sections.filter(Boolean).join('\n\n');
}
