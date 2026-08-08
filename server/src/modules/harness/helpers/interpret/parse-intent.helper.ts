import type { HarnessStepLogger } from '../../services/harness-step-logger.service.js';
import {
  type IntentResult,
  IntentSchema,
} from '../../templates/intent.schema.js';
import { parseLlmJson } from '../json/parse-llm-json.helper.js';
import { enforceRequiredTools } from '../tools/enforce-media-tools.helper.js';
import { expandToolAliases } from '../tools/expand-tool-aliases.helper.js';

/** Parse + validate the classifier's raw JSON into a typed intent. */
export function parseIntent(
  requestId: string,
  text: string,
  enabledToolNames: string[],
  stepLogger: HarnessStepLogger,
): IntentResult {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned) {
    throw new Error('Intent classification returned empty output');
  }

  try {
    const parsed = parseLlmJson(cleaned) as Record<string, unknown>;

    if (typeof parsed.imageCount === 'number' && parsed.imageCount < 0) {
      parsed.imageCount = 0;
    }
    if (typeof parsed.videoCount === 'number' && parsed.videoCount < 0) {
      parsed.videoCount = 0;
    }

    if (Array.isArray(parsed.tools)) {
      parsed.tools = expandToolAliases(parsed.tools, enabledToolNames);
    }

    const validated = IntentSchema.parse(parsed);
    if (validated.tools) {
      validated.tools = [...new Set(validated.tools)] as IntentResult['tools'];
    }
    validated.tools = enforceRequiredTools(validated, enabledToolNames);
    return validated;
  } catch (error) {
    stepLogger.warn({ requestId }, 'interpret', 'intent parse failed', {
      rawOutput: text,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Intent classification produced invalid JSON', {
      cause: error,
    });
  }
}
