import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Inject, Injectable } from '@nestjs/common';

import { AiSdkService } from '../../../ai-sdk/services/ai-sdk.service.js';
import { InterpretActionService } from '../../actions/interpret.action.js';
import { emitToSocket } from '../../helpers/emit-to-socket.helper.js';
import type { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';
import { HarnessStepLogger } from '../harness-step-logger.service.js';

const IMAGE_REQUIRED_TEMPLATES = new Set(['describe', 'compare', 'ocr']);

@Injectable()
export class InterpretStepService implements StepHandler {
  constructor(
    @Inject(InterpretActionService)
    private readonly interpretAction: InterpretActionService,
    @Inject(SocketIOService)
    private readonly io: SocketIOService,
    @Inject(AiSdkService)
    private readonly aiSdkService: AiSdkService,
    private readonly stepLogger: HarnessStepLogger,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    await this.emitStatus(ctx, 'Understanding your request…');

    const { intent, inputTokens, outputTokens } =
      await this.interpretAction.execute({
        requestId: ctx.requestId,
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

  private async emitStatus(
    ctx: HarnessContext,
    message: string,
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      status: message,
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
    if (!hasImages) {
      // No images available for an image-required template. Ask the user to
      // attach an image instead of silently falling back to a text template.
      intent.needsClarification = true;
      intent.clarificationQuestion =
        'This request requires an image. Please attach at least one image and send it again.';
      intent.plan = {};
      intent.tools = [];
      return;
    }

    // Images are present. Trust the classifier's intent: the model already
    // selected describe/compare/ocr and decided whether tools are needed. Do
    // not override it with an English clarifying question.
    intent.needsClarification = false;
    intent.clarificationQuestion = undefined;
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
