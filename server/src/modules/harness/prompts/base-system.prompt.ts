import { COMPACT_INSTRUCTIONS } from './instructions/compact.instruction.js';
import {
  COMPARE_INSTRUCTIONS,
  COMPARE_VISUAL_INSTRUCTIONS,
} from './instructions/compare.instruction.js';
import {
  DESCRIBE_CONCISE_INSTRUCTIONS,
  DESCRIBE_DETAILED_INSTRUCTIONS,
  DESCRIBE_INSTRUCTIONS,
} from './instructions/describe.instruction.js';
import {
  OCR_INSTRUCTIONS,
  OCR_VERBATIM_INSTRUCTIONS,
} from './instructions/ocr.instruction.js';
import {
  TEXT_CODING_INSTRUCTIONS,
  TEXT_INSTRUCTIONS,
} from './instructions/text.instruction.js';
import { MULTIMODAL_POLICY } from './shared/multimodal-policy.prompt.js';
import { OUTPUT_CONTRACT } from './shared/output-contract.prompt.js';
import { PRECEDENCE_RULES } from './shared/precedence-rules.prompt.js';
import { SEARCH_POLICY } from './shared/search-policy.prompt.js';
import { SECURITY_RULES } from './shared/security-rules.prompt.js';

const MODE_PROMPTS: Record<string, string> = {
  text: TEXT_INSTRUCTIONS,
  coding: TEXT_CODING_INSTRUCTIONS,
  ocr: OCR_INSTRUCTIONS,
  ocrVerbatim: OCR_VERBATIM_INSTRUCTIONS,
  compare: COMPARE_INSTRUCTIONS,
  compareVisual: COMPARE_VISUAL_INSTRUCTIONS,
  describe: DESCRIBE_INSTRUCTIONS,
  describeDetailed: DESCRIBE_DETAILED_INSTRUCTIONS,
  describeConcise: DESCRIBE_CONCISE_INSTRUCTIONS,
  compact: COMPACT_INSTRUCTIONS,
};

export type PromptMode = keyof typeof MODE_PROMPTS;

/**
 * Legacy base system prompt used by the direct chat helper.
 * @deprecated Use buildContentSystemPrompt from content-system.prompt.ts for new code.
 */
export const buildBaseSystemPrompt = ({
  hasImages = false,
}: {
  hasImages?: boolean;
}) => {
  return [
    OUTPUT_CONTRACT,
    SECURITY_RULES,
    PRECEDENCE_RULES,
    hasImages ? MULTIMODAL_POLICY : '',
    hasImages ? SEARCH_POLICY : '',
    'FINAL REMINDER:',
    '- Structured templates require a single valid JSON object; free-form templates require plain text. No Markdown, no explanations.',
  ]
    .filter(Boolean)
    .join('\n\n');
};

/**
 * Legacy mode-aware system prompt used by the compact service.
 * @deprecated Use buildContentSystemPrompt from content-system.prompt.ts for new code.
 */
export const buildModeSystemPrompt = ({
  mode = 'text',
  hasImages = false,
}: {
  mode?: PromptMode;
  hasImages?: boolean;
}) => {
  if (mode === 'compact') return COMPACT_INSTRUCTIONS;

  const effectiveMode: PromptMode = hasImages ? mode : 'text';

  return [
    OUTPUT_CONTRACT,
    SECURITY_RULES,
    PRECEDENCE_RULES,
    hasImages ? MULTIMODAL_POLICY : '',
    hasImages ? SEARCH_POLICY : '',
    MODE_PROMPTS[effectiveMode],
    'FINAL REMINDER:',
    '- Respect the active MODE rules above and the output contract: structured templates require a single valid JSON object; free-form templates require plain text.',
  ]
    .filter(Boolean)
    .join('\n\n');
};
