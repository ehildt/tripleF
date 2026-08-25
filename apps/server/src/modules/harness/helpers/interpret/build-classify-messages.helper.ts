import type { InputMessage } from '../../../ai-sdk/types/ai-sdk-messages.types.js';
import { buildStructuredJsonPrompt } from '../../constants/structured-json-prompt.constant.js';
import { buildIntentSelectionPrompt } from '../../prompts/intent-selection.prompt.js';

import { buildClassifyTranscript } from './build-classify-transcript.helper.js';

function buildSystemPrompt(basePrompt: string): string {
  const now = new Date()
    .toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    .replace(' at ', ', '); // "Friday, January 3, 2025, 10:30 AM GMT"
  return `${basePrompt}\n\nCurrent date and time: ${now}\nUse this temporal context when classifying time-sensitive requests.`;
}

/**
 * Latest user text plus the attachment marker, so the classifier knows
 * the current request carries images without sending the images.
 */
function buildImageUserContent(messages: InputMessage[]): string {
  const userMessages = messages.filter((m) => m.role === 'user');
  const latestText = userMessages.at(-1)?.content ?? '';

  const imageCount =
    userMessages.findLast((m) => m.images && m.images.length > 0)?.images
      ?.length ?? 0;

  const marker =
    imageCount > 0
      ? imageCount === 1
        ? ' [1 image attached]'
        : ` [${imageCount} images attached]`
      : '';

  return [latestText, marker].filter(Boolean).join(' ');
}

/**
 * Build the classify messages for the interpret step.
 *
 * The interpret step is the context gatekeeper: it derives the query-focused
 * contextSummary that downstream steps rely on, so it must see the full
 * conversation. Earlier turns move into a delimited transcript inside the
 * system message — reference-only data that the classifier cannot confuse
 * with the current request, which stays as the final user message.
 */
export function buildClassifyMessages(
  messages: InputMessage[],
  enabledToolNames: string[],
  language?: string,
  memoryProbe?: string,
  personaName?: string,
): InputMessage[] {
  const prompt = `${buildIntentSelectionPrompt(
    enabledToolNames,
    language,
  )}\n\n${buildStructuredJsonPrompt()}`;

  const systemContent = buildSystemPrompt(prompt);

  const hasImages = messages.some(
    (m) => m.role === 'user' && m.images && m.images.length > 0,
  );

  const nonSystem = messages.filter((m) => m.role !== 'system');

  const latestUserIndex = nonSystem.findLastIndex((m) => m.role === 'user');
  const latestUser =
    latestUserIndex >= 0 ? nonSystem[latestUserIndex] : undefined;

  // The transcript always covers every turn before the latest user message —
  // including earlier user turns, whose constraints the classifier needs to
  // resolve follow-ups. Image attachments are not sent; the latest message
  // carries an attachment marker instead.
  const transcriptSource = nonSystem.slice(
    0,
    latestUserIndex < 0 ? nonSystem.length : latestUserIndex,
  );
  const transcript = buildClassifyTranscript(transcriptSource);

  const latestUserContent = hasImages
    ? buildImageUserContent(nonSystem)
    : (latestUser?.content ?? '');

  const identityLine = personaName
    ? `\n\nYOUR IDENTITY: the user named you "${personaName}". A bare address like "${personaName}?" is the user calling YOU — classify it as a plain conversational turn (template "text", prompt "default", no tools), never as a familiarity question about a public figure. A question ABOUT "${personaName}" as a topic (e.g. "tell me about ${personaName}") is still a topic question.`
    : '';

  return [
    {
      role: 'system' as const,
      content: `${systemContent}${identityLine}${transcript ? `\n\n${transcript}` : ''}${memoryProbe ? `\n\n${memoryProbe}` : ''}`,
    },
    ...(latestUserContent
      ? [{ role: 'user' as const, content: latestUserContent }]
      : []),
  ];
}
