import type { HarnessJobPayload } from '../dtos/harness-job.dto.js';

export function buildVisionExclusionNotice(
  model: string,
  meta: HarnessJobPayload['meta'],
): string {
  if (meta.length === 0) return '';
  const names = meta.map((entry) => entry.name).join(', ');
  return [
    `The user attached ${meta.length} image(s) (${names}), but the selected model "${model}" does not support vision.`,
    'Exclude the image(s) from your analysis and answer based only on the text prompt(s).',
    "Respond in the same language as the user's last message.",
  ].join(' ');
}
