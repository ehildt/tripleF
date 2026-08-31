import { formatToolAvailabilityCatalog } from './helpers/tool-catalog.helper.js';
import { formatVariantCatalog } from './helpers/variant-catalog.helper.js';
import {
  buildAvailableTemplates,
  CLASSIFICATION_RULES,
  MEDIA_REQUEST_RULES,
  TEMPLATE_RULES,
} from './intent-selection/classification.prompt.js';
import { CONTEXT_SUMMARY_RULES, TOPIC_SWITCH_RULES } from './intent-selection/context-summary.prompt.js';
import { TEMPLATE_SELECTION_EXAMPLES } from './intent-selection/examples.prompt.js';
import {
  CLARIFICATION_EXAMPLES,
  CLARIFICATION_QUESTION_STYLE,
  CLARIFICATION_RULES,
  FOLLOW_UP_RULES,
  TOPIC_BASED_TOOL_RULES,
} from './intent-selection/follow-up.prompt.js';
import { buildIntentLanguageRules } from './intent-selection/language-rules.prompt.js';
import {
  MEMORY_AWARE_CLARIFICATION_RULES,
  MEMORY_RULES,
  SOURCE_AWARENESS_RULES,
} from './intent-selection/memory-rules.prompt.js';
import { MERGE_REQUEST_RULES } from './intent-selection/merge-request.prompt.js';
import {
  COMPARE_UPLOADED_ONLY_RULES,
  IMAGE_PLAN_RULES,
  IMAGE_REQUIRED_TEMPLATE_GUARDRAIL,
  IMAGE_SELF_ANALYSIS_TOOL_RULES,
  MULTIMODAL_TEMPLATE_RULES,
} from './intent-selection/multimodal.prompt.js';
import {
  IMAGELIST_TEMPLATE_RULES,
  NEWS_TEMPLATE_RULES,
  PRODUCT_TEMPLATE_RULES,
  SHOPLIST_TEMPLATE_RULES,
  STOCKMARKET_TEMPLATE_RULES,
  VIDEOLIST_TEMPLATE_RULES,
} from './intent-selection/template-selection.prompt.js';
import {
  EXPLICIT_PROVIDER_RULES,
  FETCH_AFTER_SEARCH_RULES,
  MEDIA_COUNT_RULES,
  MEDIA_TYPE_TOOL_RULES,
  OUTPUT_FORMAT_POINTER,
  PLACES_TOOL_RULES,
  RECENCY_RULES,
  TOOL_DETERMINISM_RULES,
  TOOL_NAME_RULES,
  TOOL_SELECTION_MODEL,
  WHEN_TO_USE_TOOLS_RULES,
} from './intent-selection/tool-selection.prompt.js';
import { FAMILIARITY_QUESTION_RULES, VARIANT_SELECTION_RULES } from './intent-selection/variant-selection.prompt.js';

/**
 * The intent-classifier system prompt, composed from the section modules in
 * intent-selection/. Each module owns one concern (language, context,
 * templates, tools, multimodal, follow-ups, clarification); the composer
 * fixes their order — the per-template detail sections lead, then the tool
 * catalog and rules, then classification mechanics, examples, and the
 * follow-up/clarification playbook.
 */
export function buildIntentSelectionPrompt(toolNames: string[], language?: string): string {
  return `You are a deterministic intent-classification engine for a multi-stage AI pipeline.
You ONLY classify and understand the user request.
You do NOT answer the user.
You MUST include \`reasoning\` — keep it concise (30 words or fewer).
You MUST include \`contextSummary\` — a query-focused extraction of the prior conversation context that the latest user message references or depends on. Empty if no relevant context.
You output ONLY valid JSON.

${CONTEXT_SUMMARY_RULES}

${TOPIC_SWITCH_RULES}

${buildIntentLanguageRules(language)}

OUTPUT OBJECTIVES
You must determine:
1 response template
2 prompt variant
3 primary user intent
4 required tools to achieve the user's intent
5 image processing plan (resize + optional variants) when images are attached

${buildAvailableTemplates()}

AVAILABLE PROMPT VARIANTS BY TEMPLATE
${formatVariantCatalog().join('\n')}

${MERGE_REQUEST_RULES}

${VARIANT_SELECTION_RULES}

${MEMORY_RULES}

${FAMILIARITY_QUESTION_RULES}

${PRODUCT_TEMPLATE_RULES}

${SHOPLIST_TEMPLATE_RULES}

${IMAGELIST_TEMPLATE_RULES}

${VIDEOLIST_TEMPLATE_RULES}

${NEWS_TEMPLATE_RULES}

${STOCKMARKET_TEMPLATE_RULES}

${IMAGE_PLAN_RULES}

${formatToolAvailabilityCatalog(toolNames).join('\n')}

${TOOL_NAME_RULES}

${EXPLICIT_PROVIDER_RULES}

${TOOL_SELECTION_MODEL}

${WHEN_TO_USE_TOOLS_RULES}

${FETCH_AFTER_SEARCH_RULES}

${MEDIA_TYPE_TOOL_RULES}

${PLACES_TOOL_RULES}

${MEDIA_COUNT_RULES}

${RECENCY_RULES}

${MULTIMODAL_TEMPLATE_RULES}

${COMPARE_UPLOADED_ONLY_RULES}

${CLASSIFICATION_RULES}

${TEMPLATE_RULES}

${IMAGE_SELF_ANALYSIS_TOOL_RULES}

${MEDIA_REQUEST_RULES}

${TEMPLATE_SELECTION_EXAMPLES}

${FOLLOW_UP_RULES}

${TOPIC_BASED_TOOL_RULES}

${CLARIFICATION_RULES}

${MEMORY_AWARE_CLARIFICATION_RULES}

${SOURCE_AWARENESS_RULES}

${CLARIFICATION_QUESTION_STYLE}

${IMAGE_REQUIRED_TEMPLATE_GUARDRAIL}

${CLARIFICATION_EXAMPLES}

${OUTPUT_FORMAT_POINTER}

${TOOL_DETERMINISM_RULES}
`;
}
