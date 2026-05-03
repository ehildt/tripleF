import { COMPACT_INSTRUCTIONS } from './instructions/compact.instruction.js';
import { COMPARE_INSTRUCTIONS } from './instructions/compare.instruction.js';
import { DESCRIBE_INSTRUCTIONS } from './instructions/describe.instruction.js';
import { OCR_INSTRUCTIONS } from './instructions/ocr.instruction.js';
import { TEXT_INSTRUCTIONS } from './instructions/text.instruction.js';
import { MULTIMODAL_POLICY } from './policies/multimodal.policy.js';
import { SEARCH_POLICY } from './policies/search.policy.js';
import { CORE_SYSTEM_CONTRACT } from './rules/core-system-contract.rule.js';
import { PRECEDENCE_RULES } from './rules/precedence.rule.js';

const MODE_PROMPTS = {
  text: TEXT_INSTRUCTIONS,
  ocr: OCR_INSTRUCTIONS,
  compare: COMPARE_INSTRUCTIONS,
  describe: DESCRIBE_INSTRUCTIONS,
  compact: COMPACT_INSTRUCTIONS,
} as const;

export type PromptMode = keyof typeof MODE_PROMPTS;

export const buildBaseSystemPrompt = ({
  hasImages = false,
}: {
  hasImages?: boolean;
}) => {
  return [
    CORE_SYSTEM_CONTRACT,
    PRECEDENCE_RULES,
    hasImages ? MULTIMODAL_POLICY : '',
    hasImages ? SEARCH_POLICY : '',
    'FINAL REMINDER:',
    '- Structured templates require a single valid JSON object; free-form templates require plain text. No Markdown, no explanations.',
  ]
    .filter(Boolean)
    .join('\n\n');
};

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
    CORE_SYSTEM_CONTRACT,
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
