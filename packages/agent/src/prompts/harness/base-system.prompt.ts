import { MULTIMODAL_POLICY } from '../shared/multimodal-policy.prompt.js';
import { NOISE_RULES } from '../shared/noise-rules.prompt.js';
import { SECURITY_RULES } from '../shared/security-rules.prompt.js';

/**
 * Base system message attached to every harness request. It carries only the
 * step-agnostic rules: the output contract, precedence order, and per-template
 * media rules are added by the respond step per selected template, and the
 * search/query rules by the execute step — repeating (or pre-empting) them
 * here made structured responses leak Markdown guidance intended for text.
 */
export const buildBaseSystemPrompt = ({ hasImages = false }: { hasImages?: boolean }) => {
  return `${SECURITY_RULES}\n\n${NOISE_RULES}${hasImages ? `\n\n${MULTIMODAL_POLICY}` : ''}`;
};
