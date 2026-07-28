import { MULTIMODAL_POLICY } from './shared/multimodal-policy.prompt.js';
import { OUTPUT_CONTRACT } from './shared/output-contract.prompt.js';
import { PRECEDENCE_RULES } from './shared/precedence-rules.prompt.js';
import { SEARCH_POLICY } from './shared/search-policy.prompt.js';
import { SECURITY_RULES } from './shared/security-rules.prompt.js';

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
    '- Structured templates require a single valid JSON object; text is free-form and allows Markdown; compact is a plain text summary. No explanations.',
  ]
    .filter(Boolean)
    .join('\n\n');
};
