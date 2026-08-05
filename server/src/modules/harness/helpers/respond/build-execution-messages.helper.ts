import type { InputMessage } from '../../../ai-sdk/types/ai-sdk-messages.types.js';
import type { SourcesConfig } from '../../../provider-overrides/configs/sources-config.adapter.js';
import { buildContentSystemPrompt } from '../../prompts/content-system.prompt.js';
import { resolveVariantInstructions } from '../../prompts/variant-instructions.registry.js';
import type { HarnessStepLogger } from '../../services/harness-step-logger.service.js';
import type { IntentResult } from '../../templates/intent.schema.js';
import { selectStepHistory } from '../select-step-history.helper.js';
import {
  getOptionalKeys,
  getRequiredKeys,
} from '../template-placeholders.constant.js';

const IMAGE_TEMPLATES = ['describe', 'compare', 'ocr'];

/** Assemble the system + context messages the response model sees. */
export function buildExecutionMessages(params: {
  requestId: string;
  intent: IntentResult;
  messages: InputMessage[];
  availableImages?: Array<Record<string, unknown>>;
  sources: SourcesConfig;
  stepLogger: HarnessStepLogger;
}): InputMessage[] {
  const { requestId, intent, messages, availableImages, sources, stepLogger } =
    params;

  const isImageTask = IMAGE_TEMPLATES.includes(intent.template);
  const requiredKeys = getRequiredKeys(intent.template);
  const optionalKeys = getOptionalKeys(intent.template);
  const instructions = resolveVariantInstructions(
    intent.template,
    intent.prompt,
  );

  const executionSystem = buildContentSystemPrompt({
    template: intent.template,
    instructions,
    tools: intent.tools,
    requiredKeys,
    optionalKeys,
    isImageTask,
    contextSummary: intent.contextSummary,
    language: intent.language ?? undefined,
    sources,
  });

  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  if (!isImageTask) {
    // Downstream steps consume the query-focused contextSummary (already
    // injected into the execution system prompt) instead of the raw
    // transcript — except when the history is short, the template recaps
    // it, or free-form chat needs the last exchange for tone.
    const selection = selectStepHistory({
      messages: nonSystemMessages,
      template: intent.template,
    });

    stepLogger.log({ requestId }, 'respond', 'history selected', {
      mode: selection.mode,
      keptCount: selection.messages.length,
      droppedCount: nonSystemMessages.length - selection.messages.length,
    });

    return [
      { role: 'system', content: executionSystem },
      ...systemMessages,
      ...selection.messages,
    ];
  }

  const contextMessages = buildImageContextMessages(messages, availableImages);

  return [
    { role: 'system', content: executionSystem },
    ...systemMessages,
    ...contextMessages,
  ];
}

function buildImageContextMessages(
  allMessages: InputMessage[],
  availableImages?: Array<Record<string, unknown>>,
): InputMessage[] {
  const isToolContextMessage = (m: InputMessage) =>
    m.role === 'system' &&
    (m.content.startsWith('[TOOL CONTEXT') ||
      m.content.startsWith('[AVAILABLE IMAGES'));

  const nonSystemMessages = allMessages.filter((m) => m.role !== 'system');

  const imageMessage = nonSystemMessages.findLast(
    (m) => m.role === 'user' && m.images && m.images.length > 0,
  );
  const toolContextMessage = allMessages.findLast(isToolContextMessage);

  const contextMessages: InputMessage[] = [];

  if (imageMessage) {
    contextMessages.push(imageMessage);
  } else {
    const lastUser = nonSystemMessages.filter((m) => m.role === 'user').at(-1);
    if (lastUser) contextMessages.push(lastUser);
  }

  if (toolContextMessage) {
    contextMessages.push(toolContextMessage);
  }

  if (availableImages && availableImages.length > 0) {
    contextMessages.push({
      role: 'system',
      content: `[AVAILABLE IMAGES — DO NOT OUTPUT]\n${JSON.stringify(
        availableImages,
        null,
        2,
      )}`,
    });
  }

  return contextMessages;
}
