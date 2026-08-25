import { COMMONMARK_FORMAT } from '../shared/commonmark-format.prompt.js';
import { FINAL_REMINDER } from '../shared/final-reminder.prompt.js';
import { HISTORY_URLS_RULES } from '../shared/history-urls.prompt.js';
import { IMAGE_TASK_RULE } from '../shared/image-task-rule.prompt.js';
import { ITEM_SHAPES } from '../shared/item-shapes.prompt.js';
import { JSON_RULES } from '../shared/json-rules.prompt.js';
import { buildLanguageRule } from '../shared/language-rule.prompt.js';
import { buildLocalizationRule } from '../shared/localization-rule.prompt.js';
import { MEDIA_COUNTS } from '../shared/media-counts.prompt.js';
import { MEDIA_RULES } from '../shared/media-rules.prompt.js';
import { MERGE_MEDIA_RULES, MERGE_TOPIC_RULE } from '../shared/merge-rules.prompt.js';
import { MULTIMODAL_POLICY } from '../shared/multimodal-policy.prompt.js';
import { NOISE_RULES } from '../shared/noise-rules.prompt.js';
import { buildOutputContract } from '../shared/output-contract.prompt.js';
import { PRECEDENCE_RULES } from '../shared/precedence-rules.prompt.js';
import { SECURITY_RULES } from '../shared/security-rules.prompt.js';
import { buildSourcePolicyPrompt } from '../shared/source-policy.prompt.js';
import { SOURCE_TRUTH_RULES } from '../shared/source-truth.prompt.js';
import { SOURCE_VOICE_RULES } from '../shared/source-voice.prompt.js';
import { TOOL_RESULTS_RULES } from '../shared/tool-results.prompt.js';
import { isSnippetTemplate } from '../snippets/snippet-presets.constant.js';

import { buildContextSummarySection } from './helpers/build-context-summary-section.helper.js';
import type { ContentSystemPromptParams } from './content-system.prompt.types.js';

/** The topic boundary rule: merge consolidates; every other template stays on topic. */
function buildTopicRule(template: string): string {
  if (template === 'merge') return MERGE_TOPIC_RULE;
  return 'STAY ON TOPIC: this response covers ONLY the subject of the latest user request. Never merge, drift into, or bolt on unrelated topics, stories, facts, sources, or media — even when earlier conversation turns or the retrieved results contain them. If the latest message refers to an earlier topic, use only that topic; otherwise ignore all earlier turns.';
}

/** Media history rule; merge replaces it (embedded material is vetted). */
function buildHistoryMediaRule(template: string): string {
  return template === 'merge' ? MERGE_MEDIA_RULES : HISTORY_URLS_RULES;
}

export function buildContentSystemPrompt(params: ContentSystemPromptParams): string {
  const isTextTemplate = params.template === 'text';
  // Only the text template is free-form; every other template is structured
  // (JSON) and carries media, so it gets the media rules.
  const isFreeForm = isTextTemplate;
  const isStructured = !isFreeForm;
  const isMediaTemplate = isStructured;

  let returnDirective: string;
  if (isTextTemplate) {
    returnDirective = 'Return free-form text. Markdown is allowed and encouraged when it improves readability.';
  } else {
    const required = params.requiredKeys.join(', ') || '(none)';
    const optional = params.optionalKeys.join(', ') || '(none)';
    returnDirective = `Return a single JSON object with these required top-level keys: ${required}.
Optional keys, include only when they add value: ${optional}.
Do not add other top-level keys — unknown keys are dropped.`;
  }

  const sections: string[] = [
    buildOutputContract(params.template),
    buildLanguageRule(params.language),
    SECURITY_RULES,
    PRECEDENCE_RULES,
    NOISE_RULES,
  ];

  if (params.isImageTask) sections.push(MULTIMODAL_POLICY, IMAGE_TASK_RULE);

  sections.push(`TEMPLATE: ${params.template}`, returnDirective);

  if (isTextTemplate) sections.push(COMMONMARK_FORMAT);

  if (isStructured) {
    sections.push(JSON_RULES);
    // Snippet-composed templates carry each item shape inside its own
    // snippet block; injecting the generic ITEM_SHAPES would duplicate them.
    if (isMediaTemplate && !isSnippetTemplate(params.template)) sections.push(ITEM_SHAPES);
  }

  if (params.instructions) sections.push(`EXECUTION INSTRUCTIONS\n${params.instructions}`);

  sections.push(
    'DATA SOURCES',
    params.tools.length === 0
      ? 'No external results are available. Use only the conversation.'
      : 'Retrieved articles and media are authoritative. Prefer them over internal knowledge. Never fabricate facts, citations, or URLs.',
    buildTopicRule(params.template),
    SOURCE_TRUTH_RULES,
    SOURCE_VOICE_RULES,
    TOOL_RESULTS_RULES,
  );

  // Runtime source policy (SysCtl): preferred domains = soft rank guidance,
  // blocked domains = absolute exclusions.
  const sourcePolicy = buildSourcePolicyPrompt(params.sources);
  if (sourcePolicy) sections.push(sourcePolicy);

  if (isMediaTemplate) {
    sections.push(MEDIA_RULES, MEDIA_COUNTS);
    sections.push(buildHistoryMediaRule(params.template));
  }

  if (params.contextSummary) sections.push(buildContextSummarySection(params.contextSummary));

  // Localization outranks the English example labels in the per-template
  // instructions; it must land late so it takes precedence.
  sections.push(buildLocalizationRule(params.language));
  if (isStructured) sections.push(FINAL_REMINDER);
  return sections.filter(Boolean).join('\n\n');
}
