import { Injectable, Logger } from '@nestjs/common';
import {
  buildClarificationTranslationSystemPrompt,
  buildClarificationTranslationUserPrompt,
  buildMemoryProbeSection,
} from '@triplef/agent/prompts';
import type { IntentResult } from '@triplef/agent/schemas';
import { isImageTaskTemplate } from '@triplef/agent/schemas';
import { AiSdkService } from '@triplef/ai-sdk';
import { SocketIOService } from '@triplef/socketio';

import {
  EPISODE_PROBE_LIMIT,
  EPISODE_TAG,
} from '../../../memory-client/constants/memory-client.constants.js';
import { MemoryClientService } from '../../../memory-client/services/memory-client.service.js';
import { buildProviderOptions } from '../../../ollama/helpers/provider-options.helper.js';
import { InterpretActionService } from '../../actions/interpret.action.js';
import type { InterpretResult } from '../../actions/interpret.action.types.js';
import { splitCognitionProfile } from '../../helpers/cognition/split-cognition-profile.helper.js';
import { emitToSocket } from '../../helpers/emit-to-socket.helper.js';
import {
  HARNESS_ACTIVITY_KEYS,
  resolveHarnessActivityLanguage,
} from '../../helpers/harness-activity.helper.js';
import type { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

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
  private readonly logger = new Logger(InterpretStepService.name);

  constructor(
    private readonly interpretAction: InterpretActionService,
    private readonly io: SocketIOService,
    private readonly aiSdkService: AiSdkService,
    private readonly memoryClient: MemoryClientService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    await this.emitStatus(ctx, HARNESS_ACTIVITY_KEYS.understanding);

    const personaName = await this.resolvePersonaName(ctx);

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
        personaName,
        onIntent: (intent) => {
          ctx.outputs.intent = intent;
        },
        onReasoningDelta: (delta) => this.emitReasoningDelta(ctx, delta),
      });

    // The classifier wants to ask the user. Before honoring that, probe the
    // user's memory and give the classifier one more pass with the probe in
    // hand — a reference that looks ambiguous in the transcript alone is often
    // resolvable from what the user told us before.
    if (intent.needsClarification) {
      const resolved = await this.resolveClarificationWithMemory(
        ctx,
        intent,
        personaName,
      );
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
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'interpret',
          clarificationQuestion: intent.clarificationQuestion,
          language: intent.language,
          template: intent.template,
        },
        'model asked clarifying question',
      );
      ctx.done = true;
      ctx.doneReason = 'clarification';
    } else {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'interpret',
          language: intent.language,
          template: intent.template,
          prompt: intent.prompt,
          tools: intent.tools,
          contextSummary: intent.contextSummary,
          needsClarification: intent.needsClarification,
        },
        'intent final',
      );
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
    personaName?: string,
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

    // Episode probe: the AI's short-term memory of past turns (cognition
    // lane) — resolves references to "the thing we were working on" that the
    // fact partition never captured. Recency-blended, topic-matched.
    const cognitionKey =
      ctx.memoryCognition ?? ctx.memoryPartition ?? ctx.sessionId;
    const episodeProbeLimit = await this.resolveEpisodeProbeLimit();
    const episodeHits =
      cognitionKey && episodeProbeLimit > 0
        ? await this.memoryClient.searchByText({
            text: query,
            tags: [EPISODE_TAG],
            recency: true,
            limit: episodeProbeLimit,
          })
        : [];
    const episodeSection = episodeHits.length
      ? `RECENT CONVERSATIONS — what you and the user were working on in recent turns (topic-matched):\n${episodeHits.map((hit) => `- ${hit.text}`).join('\n')}`
      : undefined;

    const combinedProbe = [probeSection, episodeSection]
      .filter(Boolean)
      .join('\n\n');
    if (!combinedProbe) return undefined;

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
        memoryProbe: combinedProbe,
        personaName,
        onIntent: (intent) => {
          ctx.outputs.intent = intent;
        },
        onReasoningDelta: (delta) => this.emitReasoningDelta(ctx, delta),
      });
    } catch (error) {
      // A failed second pass must not turn a clarification into a hard error
      // — fall back to the first-pass question.
      this.logger.warn(
        {
          requestId: ctx.requestId,
          step: 'interpret',
          err: error instanceof Error ? error : new Error(String(error)),
        },
        'memory-probe reinterpret failed; keeping clarification',
      );
      return undefined;
    }

    if (result.intent.needsClarification) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'interpret',
          probeHits: hits.length,
        },
        'memory probe did not resolve ambiguity',
      );
      return undefined;
    }

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'interpret',
        probeHits: hits.length,
        template: result.intent.template,
      },
      'ambiguity resolved from memory probe',
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

  /**
   * The AI's own name from the cognition persona, when the user has set one.
   * Injected into the classifier so a bare address ("Shinku?") is recognized
   * as a direct call to the AI, not a familiarity question about a public
   * figure. Best-effort — a read failure degrades to no name, never a failed
   * turn.
   */
  private async resolvePersonaName(
    ctx: HarnessContext,
  ): Promise<string | undefined> {
    const cognitionKey =
      ctx.memoryCognition ?? ctx.memoryPartition ?? ctx.sessionId;
    if (!cognitionKey) return undefined;
    try {
      const snapshot = await this.memoryClient.getCognition(cognitionKey);
      const profile = snapshot.profile
        ? (JSON.parse(snapshot.profile) as Record<string, unknown> | undefined)
        : undefined;
      const { persona } = splitCognitionProfile(profile);
      const name = persona?.name;
      return typeof name === 'string' && name.trim() ? name.trim() : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * The effective episode probe limit (system variable) for the clarification
   * probe. Best-effort — a read failure falls back to the built-in default.
   */
  private async resolveEpisodeProbeLimit(): Promise<number> {
    try {
      const overrides = await this.memoryClient.getOverrides();
      return overrides.episodeProbeLimit ?? EPISODE_PROBE_LIMIT;
    } catch {
      return EPISODE_PROBE_LIMIT;
    }
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

  private async emitReasoningDelta(
    ctx: HarnessContext,
    reasoningDelta: string,
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      reasoningDelta,
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
    if (!isImageTaskTemplate(intent.template)) return;

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
    this.logger.warn(
      {
        requestId: ctx.requestId,
        step: 'interpret',
        template: intent.template,
        fallbackTemplate,
      },
      'image-only template downgraded',
    );
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

    const latestUserMessage = this.findLatestUserText(ctx.request.messages);

    try {
      const { text } = await this.aiSdkService.generateChat({
        model: ctx.model,
        messages: [
          {
            role: 'system',
            content: buildClarificationTranslationSystemPrompt(language),
          },
          {
            role: 'user',
            content: buildClarificationTranslationUserPrompt(
              englishQuestion,
              latestUserMessage,
            ),
          },
        ],
        providerOptions: buildProviderOptions({
          keepAlive: ctx.request.keep_alive,
          numCtx: ctx.request.options?.num_ctx,
        }),
        abortSignal: ctx.abortSignal,
      });
      const trimmed = text.trim();
      return trimmed || englishQuestion;
    } catch (error) {
      this.logger.warn(
        {
          requestId: ctx.requestId,
          step: 'interpret',
          language,
          original: englishQuestion,
          err: error instanceof Error ? error : new Error(String(error)),
        },
        'clarification localization failed; using original text',
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
