import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable } from '@nestjs/common';

import { AiSdkService } from '../../../ai-sdk/services/ai-sdk.service.js';
import { MemoryClientService } from '../../../memory-client/services/memory-client.service.js';
import { InterpretActionService } from '../../actions/interpret.action.js';
import type { InterpretResult } from '../../actions/interpret.action.types.js';
import { emitToSocket } from '../../helpers/emit-to-socket.helper.js';
import {
  HARNESS_ACTIVITY_KEYS,
  resolveHarnessActivityLanguage,
} from '../../helpers/harness-activity.helper.js';
import { buildMemoryProbeSection } from '../../helpers/interpret/build-memory-probe-section.helper.js';
import type { IntentResult } from '../../templates/intent.schema.js';
import type { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';
import { HarnessStepLogger } from '../harness-step-logger.service.js';

const IMAGE_REQUIRED_TEMPLATES = new Set(['describe', 'compare', 'ocr']);

/**
 * Fallback for a classifier that emitted an image-only template although
 * nothing is attached. Mirrors the prompt's IMAGE-REQUIRED TEMPLATE
 * GUARDRAIL: never ask the user for an image here — informational
 * comparisons become 'evaluation', describe/ocr follow-ups without
 * attachments become 'summary'.
 */
const IMAGE_REQUIRED_TEMPLATE_FALLBACKS: Record<
  string,
  'evaluation' | 'summary'
> = {
  compare: 'evaluation',
  describe: 'summary',
  ocr: 'summary',
};

@Injectable()
export class InterpretStepService implements StepHandler {
  constructor(
    private readonly interpretAction: InterpretActionService,
    private readonly io: SocketIOService,
    private readonly aiSdkService: AiSdkService,
    private readonly stepLogger: HarnessStepLogger,
    private readonly memoryClient: MemoryClientService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    await this.emitStatus(ctx, HARNESS_ACTIVITY_KEYS.understanding);

    let { intent, inputTokens, outputTokens } =
      await this.interpretAction.execute({
        requestId: ctx.requestId,
        model: ctx.model,
        messages: ctx.request.messages,
        keepAlive: ctx.request.keep_alive,
        think: ctx.request.think,
        numCtx: ctx.request.options?.num_ctx,
        abortSignal: ctx.abortSignal,
        language: ctx.filters.language,
        onIntent: (intent) => {
          ctx.outputs.intent = intent;
        },
      });

    // The classifier wants to ask the user. Before honoring that, probe the
    // user's memory and give the classifier one more pass with the probe in
    // hand — a reference that looks ambiguous in the transcript alone is often
    // resolvable from what the user told us before.
    if (intent.needsClarification) {
      const resolved = await this.resolveClarificationWithMemory(ctx, intent);
      if (resolved) {
        intent = resolved.intent;
        inputTokens += resolved.inputTokens ?? 0;
        outputTokens += resolved.outputTokens ?? 0;
      }
    }

    this.enforceImageRequiredGuardrail(ctx, intent);
    this.enforceVisionSupport(ctx, intent);
    this.normalizeMediaCounts(ctx, intent);

    if (intent.needsClarification && intent.clarificationQuestion) {
      intent.clarificationQuestion = await this.localizeClarificationQuestion(
        ctx,
        intent.clarificationQuestion,
        intent.language,
      );
    }

    ctx.outputs.intent = intent;
    ctx.outputs.inputTokens = inputTokens;
    ctx.outputs.outputTokens = outputTokens;

    if (intent.needsClarification && intent.clarificationQuestion) {
      this.stepLogger.log(ctx, 'interpret', 'model asked clarifying question', {
        clarificationQuestion: intent.clarificationQuestion,
        language: intent.language,
        template: intent.template,
      });
      ctx.done = true;
      ctx.doneReason = 'clarification';
    } else {
      this.stepLogger.log(ctx, 'interpret', 'intent final', {
        language: intent.language,
        template: intent.template,
        prompt: intent.prompt,
        tools: intent.tools,
        contextSummary: intent.contextSummary,
        needsClarification: intent.needsClarification,
      });
    }
  }

  /**
   * Second-chance interpretation: when the classifier wants to clarify, probe
   * the user's fact partition and re-run the classifier with the probe block
   * injected. Returns the resolved intent (and its token cost) when the probe
   * let the classifier proceed; undefined when memory is out of scope, empty,
   * or still ambiguous.
   */
  private async resolveClarificationWithMemory(
    ctx: HarnessContext,
    firstPass: IntentResult,
  ): Promise<
    | { intent: IntentResult; inputTokens?: number; outputTokens?: number }
    | undefined
  > {
    const memoryPartition = ctx.memoryPartition ?? ctx.sessionId;
    if (!memoryPartition) return undefined;

    const query = this.buildProbeQuery(ctx, firstPass);
    if (!query) return undefined;

    const hits = await this.memoryClient.searchByText({
      memoryPartition,
      text: query,
      limit: 5,
    });
    const probeSection = buildMemoryProbeSection(hits);
    if (!probeSection) return undefined;

    let result: InterpretResult;
    try {
      result = await this.interpretAction.execute({
        requestId: ctx.requestId,
        model: ctx.model,
        messages: ctx.request.messages,
        keepAlive: ctx.request.keep_alive,
        think: ctx.request.think,
        numCtx: ctx.request.options?.num_ctx,
        abortSignal: ctx.abortSignal,
        language: ctx.filters.language,
        memoryProbe: probeSection,
        onIntent: (intent) => {
          ctx.outputs.intent = intent;
        },
      });
    } catch (error) {
      // A failed second pass must not turn a clarification into a hard error
      // — fall back to the first-pass question.
      this.stepLogger.warn(
        ctx,
        'interpret',
        'memory-probe reinterpret failed; keeping clarification',
        { error: error instanceof Error ? error.message : String(error) },
      );
      return undefined;
    }

    if (result.intent.needsClarification) {
      this.stepLogger.log(
        ctx,
        'interpret',
        'memory probe did not resolve ambiguity',
        { probeHits: hits.length },
      );
      return undefined;
    }

    this.stepLogger.log(
      ctx,
      'interpret',
      'ambiguity resolved from memory probe',
      {
        probeHits: hits.length,
        template: result.intent.template,
      },
    );
    return {
      intent: result.intent,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
  }

  /**
   * Probe query: the latest user text plus the first pass's contextSummary
   * (when present) — the summary already resolves short follow-ups, so it
   * sharpens the semantic search for the concrete subject.
   */
  private buildProbeQuery(ctx: HarnessContext, intent: IntentResult): string {
    const latest =
      this.findLatestUserText(ctx.request.messages) ?? ctx.lastUserPrompt ?? '';
    const summary = intent.contextSummary?.trim();
    return summary ? `${latest}\n${summary}` : latest;
  }

  private async emitStatus(ctx: HarnessContext, key: string): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      activity: { key },
      language: resolveHarnessActivityLanguage(ctx),
      done: false,
    });
  }

  private normalizeMediaCounts(
    ctx: HarnessContext,
    intent: NonNullable<HarnessContext['outputs']['intent']>,
  ): void {
    // Counts are only set when the user explicitly requests a number.
    // A value of 0 means "use the system-configured default".
    intent.imageCount = Math.max(0, intent.imageCount ?? 0);
    intent.videoCount = Math.max(0, intent.videoCount ?? 0);
  }

  private enforceVisionSupport(
    ctx: HarnessContext,
    intent: NonNullable<HarnessContext['outputs']['intent']>,
  ): void {
    if (!ctx.visionExcluded) return;

    intent.template = 'text';
    intent.prompt = 'default';
    intent.tools = [];
    intent.plan = {};
    intent.needsClarification = false;
    intent.clarificationQuestion = undefined;
  }

  private enforceImageRequiredGuardrail(
    ctx: HarnessContext,
    intent: NonNullable<HarnessContext['outputs']['intent']>,
  ): void {
    if (!IMAGE_REQUIRED_TEMPLATES.has(intent.template)) return;

    const hasImages = ctx.buffers.length > 0 || ctx.processedMeta.length > 0;
    if (hasImages) {
      // Images are present. Trust the classifier's intent: the model already
      // selected describe/compare/ocr and decided whether tools are needed.
      intent.needsClarification = false;
      intent.clarificationQuestion = undefined;
      return;
    }

    // No images attached. A classifier-set clarification is respected — the
    // model may have decided the user meant a previously discussed image and
    // should re-attach it; that question is localized and shown as asked.
    if (intent.needsClarification) return;

    // Otherwise the classifier misused an image-only template for a request
    // that has no image semantics (e.g. an informational comparison). Mirror
    // the prompt's guardrail: downgrade to a text template instead of asking
    // the user to attach an image they never intended to send.
    const fallbackTemplate = IMAGE_REQUIRED_TEMPLATE_FALLBACKS[intent.template];
    this.stepLogger.warn(ctx, 'interpret', 'image-only template downgraded', {
      template: intent.template,
      fallbackTemplate,
    });
    intent.template = fallbackTemplate;
    intent.prompt = 'default';
    intent.plan = {};
  }

  private async localizeClarificationQuestion(
    ctx: HarnessContext,
    englishQuestion: string,
    language?: string,
  ): Promise<string> {
    const code = language?.trim().toLowerCase() ?? '';
    if (code === 'en') return englishQuestion;

    // The model picks the language: either the detected ISO code or, when
    // detection failed, whatever language the latest user message is in.
    const targetRule =
      code.length === 2
        ? `Write ONLY in "${code}".`
        : 'Write in the SAME language as the quoted user message. Never use English unless the user message is English.';

    const latestUserMessage = this.findLatestUserText(ctx.request.messages);

    try {
      const { text } = await this.aiSdkService.generateChat({
        model: ctx.model,
        messages: [
          {
            role: 'system',
            content: `You translate short clarifying questions for a chat assistant. ${targetRule} Keep the question concise, natural, and faithful to the original meaning. Output ONLY the question.`,
          },
          {
            role: 'user',
            content: latestUserMessage
              ? `User message: ${latestUserMessage}\n\nQuestion to translate: ${englishQuestion}`
              : `Question to translate: ${englishQuestion}`,
          },
        ],
        keepAlive: ctx.request.keep_alive,
        numCtx: ctx.request.options?.num_ctx,
        abortSignal: ctx.abortSignal,
      });
      const trimmed = text.trim();
      return trimmed || englishQuestion;
    } catch (error) {
      this.stepLogger.warn(
        ctx,
        'interpret',
        'clarification localization failed; using original text',
        {
          language,
          original: englishQuestion,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      return englishQuestion;
    }
  }

  private findLatestUserText(
    messages: HarnessContext['request']['messages'],
  ): string | undefined {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (
        message.role === 'user' &&
        message.content &&
        !message.content.startsWith('Image(s):')
      ) {
        return message.content;
      }
    }
    return undefined;
  }
}
