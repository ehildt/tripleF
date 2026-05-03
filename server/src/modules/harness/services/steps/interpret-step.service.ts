import { Inject, Injectable, Logger } from '@nestjs/common';

import { InterpretActionService } from '../../actions/interpret.action.js';
import type { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

const IMAGE_REQUIRED_TEMPLATES = new Set(['describe', 'compare', 'ocr']);
const TEXT_ONLY_TEMPLATES = new Set(['summary', 'evaluation', 'text']);

@Injectable()
export class InterpretStepService implements StepHandler {
  private readonly logger = new Logger(InterpretStepService.name);

  constructor(
    @Inject(InterpretActionService)
    private readonly interpretAction: InterpretActionService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    const { intent, inputTokens, outputTokens } =
      await this.interpretAction.execute({
        model: ctx.model,
        messages: ctx.request.messages,
        keepAlive: ctx.request.keep_alive,
        think: ctx.request.think,
        numCtx: ctx.request.options?.num_ctx,
        abortSignal: ctx.abortSignal,
        onIntent: (intent) => {
          ctx.outputs.intent = intent;
        },
      });

    this.enforceImageRequiredGuardrail(ctx, intent);
    this.enforceTextOnlyWhenNoNewImages(ctx, intent);
    this.enforceVisionSupport(ctx, intent);
    this.normalizeMediaCounts(ctx, intent);

    ctx.outputs.intent = intent;
    ctx.outputs.inputTokens = inputTokens;
    ctx.outputs.outputTokens = outputTokens;

    this.logger.log('[HARNESS]', {
      step: 'interpret',
      requestId: ctx.requestId,
      model: ctx.model,
      inputTokens,
      outputTokens,
      template: intent.template,
      prompt: intent.prompt,
      tools: intent.tools,
      plan: intent.plan,
      reasoning: intent.reasoning,
      clarification: intent.needsClarification,
    });

    if (intent.needsClarification && intent.clarificationQuestion) {
      ctx.done = true;
      ctx.doneReason = 'clarification';
    }
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

  private enforceTextOnlyWhenNoNewImages(
    ctx: HarnessContext,
    intent: NonNullable<HarnessContext['outputs']['intent']>,
  ): void {
    // summary and evaluation are intentionally text-only templates; they do
    // not need images and should not be downgraded to plain text.
    if (TEXT_ONLY_TEMPLATES.has(intent.template)) return;

    // Image-required templates need images attached in the current request.
    // If the user only references previously uploaded images or sends a text
    // follow-up while images are present, fall back to plain text so we do not
    // render a describe/compare/ocr response without fresh uploads.
    if (!IMAGE_REQUIRED_TEMPLATES.has(intent.template)) return;
    if (ctx.hasNewImages || ctx.processedMeta.length === 0) return;

    intent.template = 'text';
    intent.prompt = 'default';
    intent.tools = intent.tools ?? [];
    intent.plan = {};
  }

  private enforceImageRequiredGuardrail(
    ctx: HarnessContext,
    intent: NonNullable<HarnessContext['outputs']['intent']>,
  ): void {
    if (!IMAGE_REQUIRED_TEMPLATES.has(intent.template)) return;

    const hasImages = ctx.buffers.length > 0 || ctx.processedMeta.length > 0;
    if (hasImages) {
      intent.needsClarification = false;
      intent.clarificationQuestion = undefined;
      return;
    }

    // No images at all: fall back to an appropriate text-only template rather
    // than asking the user to upload images when they clearly want a textual
    // answer about prior context.
    const userWantsComparison =
      intent.template === 'compare' ||
      /compare|comparison|vergleich|vergleiche/i.test(ctx.lastUserPrompt ?? '');
    const userWantsEvaluation =
      /evaluate|assessment|review|critique|pros and cons|bewerte|bewertung|vor- und nachteile/i.test(
        ctx.lastUserPrompt ?? '',
      );

    const targetTemplate = userWantsComparison
      ? userWantsEvaluation
        ? 'evaluation'
        : 'summary'
      : 'text';

    intent.template = targetTemplate;
    intent.prompt = 'default';
    // Preserve external research tools (especially image/video search) when the
    // user asked for online research, so summary/evaluation responses can still
    // include media and citations.
    intent.tools = (intent.tools ?? []).filter(
      (t) =>
        !t.startsWith('request') &&
        (t.endsWith('WebSearch') ||
          t.endsWith('ImageSearch') ||
          t.endsWith('VideoSearch') ||
          t.endsWith('NewsSearch') ||
          t === 'webSearch' ||
          t === 'searxngSearch' ||
          t === 'browserbaseSearch' ||
          t === 'wikipediaSearch' ||
          t === 'hackerNewsSearch'),
    );
    intent.plan = {};
    intent.needsClarification = false;
    intent.clarificationQuestion = undefined;
  }
}
