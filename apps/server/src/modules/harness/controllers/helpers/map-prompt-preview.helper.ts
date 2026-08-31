import type { Prompt } from '../../dtos/prompt.dto.js';

/** Project a prompt into the log-preview shape. */
export function mapPromptPreview(p: Prompt) {
  return {
    role: p.role,
    content: p.content?.slice(0, 200),
  };
}
