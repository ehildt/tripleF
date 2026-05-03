import { Injectable, Logger } from '@nestjs/common';

import type { InputMessage } from '../../ai-sdk/helpers/ai-sdk-message.models.js';
import type { ThinkMode } from '../../ai-sdk/helpers/ollama.helpers.js';
import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import {
  articleSchema,
  formatZodIssues,
} from '../helpers/article-json.schema.js';
import {
  compareSchema,
  formatZodIssues as formatCompareZodIssues,
} from '../helpers/compare-json.schema.js';
import {
  describeSchema,
  formatZodIssues as formatDescribeZodIssues,
} from '../helpers/describe-json.schema.js';
import {
  evaluationSchema,
  formatZodIssues as formatEvaluationZodIssues,
} from '../helpers/evaluation-json.schema.js';
import { hasBlockedImageHost } from '../helpers/is-trusted-image-url.helper.js';
import {
  formatZodIssues as formatNewsZodIssues,
  newsSchema,
} from '../helpers/news-json.schema.js';
import { normalizeJsonResponse } from '../helpers/normalize-json-response.helper.js';
import {
  formatZodIssues as formatOcrZodIssues,
  ocrSchema,
} from '../helpers/ocr-json.schema.js';
import { parseLlmJson } from '../helpers/parse-llm-json.helper.js';
import {
  formatZodIssues as formatSummaryZodIssues,
  summarySchema,
} from '../helpers/summary-json.schema.js';
import {
  templateOptionalKeys,
  templatePlaceholders,
  templateRequiredKeys,
} from '../helpers/template.helper.js';
import { buildContentSystemPrompt } from '../prompts/content-system.prompt.js';
import { resolveVariantInstructions } from '../prompts/variant-instructions.registry.js';
import { type IntentResult } from '../templates/intent.schema.js';

export type RespondResult = {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
};

const MAX_JSON_RETRIES = 3;

@Injectable()
export class RespondActionService {
  private readonly logger = new Logger(RespondActionService.name);

  constructor(private readonly aiSdkService: AiSdkService) {}

  /**
   * Phase 3 – Respond.
   *
   * Produces the final JSON payload that the dashboard will render with Eta.
   * The input messages include the original prompt, any processed images, and
   * tool results from the execute step.
   *
   * Streaming text deltas are forwarded to the client immediately. JSON
   * validation and any retries only happen once the stream has finished, so
   * we never treat an in-flight partial JSON object as a failure.
   * Non-text templates require valid JSON. If the model's final response is
   * malformed, we retry with a correction prompt until it parses or the retry
   * limit is reached.
   */
  async execute(params: {
    intent: IntentResult;
    messages: InputMessage[];
    model: string;
    keepAlive?: string;
    numCtx?: number;
    think?: ThinkMode;
    stream?: boolean;
    abortSignal?: AbortSignal;
    onTextDelta?: (delta: string) => void;
  }): Promise<RespondResult> {
    const executionMessages = this.buildExecutionMessages(params);

    this.logger.log('[HARNESS]', {
      step: 'respond',
      model: params.model,
      template: params.intent.template,
      messageCount: executionMessages.length,
      messages: executionMessages.map((m) => ({
        role: m.role,
        content: m.content,
        hasImages: !!m.images?.length,
      })),
    });

    if (params.stream) {
      return this.streamResponse(params, executionMessages);
    }

    if (params.intent.template === 'text') {
      return this.generateResponse(params, executionMessages);
    }

    // Structured templates must produce valid JSON. Force non-streaming so we
    // can validate the output and retry when it is malformed.
    return this.generateValidatedResponse(params, executionMessages);
  }

  private buildExecutionMessages(params: {
    intent: IntentResult;
    messages: InputMessage[];
  }): InputMessage[] {
    const isImageTask = ['describe', 'compare', 'ocr'].includes(
      params.intent.template,
    );
    const placeholders = templatePlaceholders(params.intent.template);
    const instructions = resolveVariantInstructions(
      params.intent.template,
      params.intent.prompt,
    );

    const executionSystem = buildContentSystemPrompt({
      template: params.intent.template,
      instructions,
      tools: params.intent.tools,
      placeholders,
      isImageTask,
      contextSummary: params.intent.contextSummary,
    });

    // For image tasks we keep only the latest user turn (with images) plus
    // any tool-results message. Conversation history is omitted because the
    // current image request is self-contained and prior assistant text can
    // distract vision models.
    const nonSystemMessages = params.messages.filter(
      (m) => m.role !== 'system',
    );
    const imageMessage = nonSystemMessages.find(
      (m) => m.role === 'user' && m.images && m.images.length > 0,
    );

    const contextMessages: InputMessage[] = isImageTask
      ? imageMessage
        ? this.buildImageContext(nonSystemMessages, imageMessage)
        : nonSystemMessages.filter((m) => m.role === 'user').slice(-1)
      : nonSystemMessages;

    const toolContextMessage = nonSystemMessages.find(
      (m) =>
        m.role === 'user' &&
        m.content.startsWith('Retrieved articles and media (JSON):'),
    );
    if (
      isImageTask &&
      toolContextMessage &&
      !contextMessages.includes(toolContextMessage)
    ) {
      contextMessages.push(toolContextMessage);
    }

    return [{ role: 'system', content: executionSystem }, ...contextMessages];
  }

  private buildImageContext(
    nonSystemMessages: InputMessage[],
    imageMessage: InputMessage,
  ): InputMessage[] {
    // Only the latest user text prompt matters for the current image request.
    const latestText = nonSystemMessages
      .filter(
        (m) =>
          m.role === 'user' && m.content && !m.content.startsWith('Image(s):'),
      )
      .at(-1)?.content;

    const marker =
      imageMessage.images?.length === 1
        ? '[1 image attached]'
        : `[${imageMessage.images?.length ?? 0} images attached]`;
    const content = latestText
      ? `${latestText}\n\n${marker}`
      : imageMessage.content;

    return [{ ...imageMessage, content }];
  }

  private async generateValidatedResponse(
    params: {
      intent: IntentResult;
      model: string;
      keepAlive?: string;
      numCtx?: number;
      think?: ThinkMode;
      abortSignal?: AbortSignal;
    },
    baseMessages: InputMessage[],
  ): Promise<RespondResult> {
    const requiredKeys = templateRequiredKeys(params.intent.template);
    const optionalKeys = templateOptionalKeys(params.intent.template);
    const messages: InputMessage[] = [...baseMessages];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let attempt = 1; attempt <= MAX_JSON_RETRIES; attempt++) {
      const result = await this.aiSdkService.generateChat({
        model: params.model,
        messages,
        keepAlive: params.keepAlive,
        numCtx: params.numCtx,
        think: params.think,
        tools: {},
        abortSignal: params.abortSignal,
      });

      totalInputTokens += result.totalUsage?.inputTokens ?? 0;
      totalOutputTokens += result.totalUsage?.outputTokens ?? 0;

      const validationResult = this.validateJsonOutput(
        result.text,
        requiredKeys,
        optionalKeys,
        params.intent.template,
      );

      if (validationResult.valid) {
        this.logger.log('[HARNESS] JSON response validated', {
          attempt,
          template: params.intent.template,
        });
        return {
          content: validationResult.content,
          inputTokens: totalInputTokens || undefined,
          outputTokens: totalOutputTokens || undefined,
        };
      }

      this.logger.warn({
        request: 'json-validation-failed',
        attempt,
        template: params.intent.template,
        error: validationResult.error,
        preview: result.text.slice(0, 500),
      });

      messages.push({
        role: 'system',
        content: this.buildCorrectionMessage(
          result.text,
          validationResult.error,
        ),
      });
    }

    throw new Error(
      `Failed to produce valid JSON for template "${params.intent.template}" after ${MAX_JSON_RETRIES} attempts`,
    );
  }

  private validateJsonOutput(
    content: string,
    requiredKeys: string[],
    optionalKeys: string[],
    template: string,
  ):
    | { valid: true; content: string; error?: undefined }
    | { valid: false; error: string; content?: undefined } {
    const cleaned = content
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    if (!cleaned) {
      return { valid: false, error: 'Response is empty.' };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parseLlmJson(cleaned) as Record<string, unknown>;
    } catch (error) {
      return {
        valid: false,
        error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    parsed = normalizeJsonResponse(parsed, template);
    parsed = this.sanitizeBlockedImageUrls(parsed) as Record<string, unknown>;

    const allKeys = new Set([...requiredKeys, ...optionalKeys]);
    const missing = requiredKeys.filter((key) => !(key in parsed));
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required keys: ${missing.join(', ')}`,
      };
    }

    // Strip unexpected top-level keys that the dashboard does not consume;
    // this prevents malformed or hallucinated keys from polluting the payload.
    const sanitized: Record<string, unknown> = {};
    for (const key of allKeys) {
      if (key in parsed) {
        sanitized[key] = parsed[key];
      }
    }

    return this.validateTemplateSchema(sanitized, template);
  }

  private sanitizeBlockedImageUrls(value: unknown): unknown {
    if (typeof value === 'string') {
      return hasBlockedImageHost(value) ? '' : value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeBlockedImageUrls(item));
    }

    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeBlockedImageUrls(val);
      }
      return sanitized;
    }

    return value;
  }

  private validateTemplateSchema(
    parsed: Record<string, unknown>,
    template: string,
  ):
    | { valid: true; content: string; error?: undefined }
    | { valid: false; error: string; content?: undefined } {
    if (template === 'article') {
      return this.validateArticleOutput(parsed);
    }

    if (template === 'news') {
      return this.validateNewsOutput(parsed);
    }

    if (template === 'describe') {
      return this.validateDescribeOutput(parsed);
    }

    if (template === 'compare') {
      return this.validateCompareOutput(parsed);
    }

    if (template === 'ocr') {
      return this.validateOcrOutput(parsed);
    }

    if (template === 'summary') {
      return this.validateSummaryOutput(parsed);
    }

    if (template === 'evaluation') {
      return this.validateEvaluationOutput(parsed);
    }

    return { valid: true, content: JSON.stringify(parsed) };
  }

  private validateArticleOutput(
    parsed: Record<string, unknown>,
  ):
    | { valid: true; content: string; error?: undefined }
    | { valid: false; error: string; content?: undefined } {
    const schemaResult = articleSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
      };
    }

    const article = schemaResult.data;
    const textToRead = [
      article.title,
      article.summary,
      article.sectionContent,
      article.conclusion,
    ]
      .filter(Boolean)
      .join(' ');
    const readTime = article.readTime?.trim()
      ? article.readTime
      : this.computeReadTime(textToRead);

    const normalized = {
      ...article,
      readTime,
    };

    return { valid: true, content: JSON.stringify(normalized) };
  }

  private validateNewsOutput(
    parsed: Record<string, unknown>,
  ):
    | { valid: true; content: string; error?: undefined }
    | { valid: false; error: string; content?: undefined } {
    const schemaResult = newsSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatNewsZodIssues(schemaResult.error.issues)}`,
      };
    }

    const news = schemaResult.data;
    const textToRead = [
      news.headline,
      news.deck,
      news.lead,
      news.sectionContent,
    ]
      .filter(Boolean)
      .join(' ');
    const readTime = news.readTime?.trim()
      ? news.readTime
      : this.computeReadTime(textToRead);

    const normalized = {
      ...news,
      readTime,
    };

    return { valid: true, content: JSON.stringify(normalized) };
  }

  private validateDescribeOutput(
    parsed: Record<string, unknown>,
  ):
    | { valid: true; content: string; error?: undefined }
    | { valid: false; error: string; content?: undefined } {
    const schemaResult = describeSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatDescribeZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateCompareOutput(
    parsed: Record<string, unknown>,
  ):
    | { valid: true; content: string; error?: undefined }
    | { valid: false; error: string; content?: undefined } {
    const schemaResult = compareSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatCompareZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateOcrOutput(
    parsed: Record<string, unknown>,
  ):
    | { valid: true; content: string; error?: undefined }
    | { valid: false; error: string; content?: undefined } {
    const schemaResult = ocrSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatOcrZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateSummaryOutput(
    parsed: Record<string, unknown>,
  ):
    | { valid: true; content: string; error?: undefined }
    | { valid: false; error: string; content?: undefined } {
    const schemaResult = summarySchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatSummaryZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateEvaluationOutput(
    parsed: Record<string, unknown>,
  ):
    | { valid: true; content: string; error?: undefined }
    | { valid: false; error: string; content?: undefined } {
    const schemaResult = evaluationSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatEvaluationZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private computeReadTime(text: string): string {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  }

  private buildCorrectionMessage(invalidOutput: string, error: string): string {
    return [
      'Your previous response was not valid.',
      `Error: ${error}`,
      '',
      'Return ONLY a single valid JSON object.',
      'All object keys must be quoted with double quotes.',
      'Do not add markdown code fences, explanations, or extra text.',
      'Ensure every required key is present and has the correct type.',
      '',
      'ARRAY RULES (the most common failure):',
      '- keyFindings and keyPoints must be arrays of objects: [{"text":"..."}] — never strings like ["..."].',
      '- sources must be arrays of objects: [{"url":"https://...","title":"..."}] — never strings.',
      '- galleryItems must be arrays of objects: [{"imageUrl":"https://...","imageAlt":"...","title":"...","caption":"..."}].',
      '- videoGalleryItems must be arrays of objects: [{"videoUrl":"https://..."}].',
      '',
      'Example of a valid response shape:',
      '{',
      '  "category": "...",',
      '  "title": "...",',
      '  "keyFindings": [{ "text": "..." }],',
      '  "sources": [{ "url": "https://example.com", "title": "Example" }],',
      '  "galleryItems": [{ "imageUrl": "https://example.com/img.jpg", "imageAlt": "...", "title": "...", "caption": "..." }]',
      '}',
      '',
      'FINAL REMINDER:',
      '- Return ONLY a single valid JSON object. No markdown code fences, no explanations, no extra text.',
    ].join('\n');
  }

  private async streamResponse(
    params: {
      intent: IntentResult;
      model: string;
      keepAlive?: string;
      numCtx?: number;
      think?: ThinkMode;
      abortSignal?: AbortSignal;
      onTextDelta?: (delta: string) => void;
    },
    messages: InputMessage[],
  ): Promise<RespondResult> {
    const result = await this.aiSdkService.streamChat({
      model: params.model,
      messages,
      keepAlive: params.keepAlive,
      numCtx: params.numCtx,
      think: params.think,
      tools: {},
      abortSignal: params.abortSignal,
    });

    let content = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const part of result.fullStream) {
      if (part.type === 'text-delta' && part.text) {
        content += part.text;
        params.onTextDelta?.(part.text);
      } else if (part.type === 'finish') {
        const usage = (part as any).totalUsage ?? (part as any).usage;
        if (usage) {
          inputTokens = usage.inputTokens ?? 0;
          outputTokens = usage.outputTokens ?? 0;
        }
      }
    }

    if (!content) {
      this.logger.warn(
        '[HARNESS] Stream returned empty content; retrying non-stream',
      );
      return params.intent.template === 'text'
        ? this.generateResponse(params, messages)
        : this.generateValidatedResponse(params, messages);
    }

    if (params.intent.template !== 'text') {
      const validationResult = this.validateJsonOutput(
        content,
        templateRequiredKeys(params.intent.template),
        templateOptionalKeys(params.intent.template),
        params.intent.template,
      );

      if (!validationResult.valid) {
        this.logger.warn({
          request: 'stream-json-validation-failed',
          template: params.intent.template,
          error: validationResult.error,
          preview: content.slice(0, 500),
        });
        return this.generateValidatedResponse(params, messages);
      }

      return {
        content: validationResult.content,
        inputTokens: inputTokens || undefined,
        outputTokens: outputTokens || undefined,
      };
    }

    return {
      content,
      inputTokens: inputTokens || undefined,
      outputTokens: outputTokens || undefined,
    };
  }

  private async generateResponse(
    params: {
      intent: IntentResult;
      model: string;
      keepAlive?: string;
      numCtx?: number;
      think?: ThinkMode;
      abortSignal?: AbortSignal;
    },
    messages: InputMessage[],
  ): Promise<RespondResult> {
    const result = await this.aiSdkService.generateChat({
      model: params.model,
      messages,
      keepAlive: params.keepAlive,
      numCtx: params.numCtx,
      think: params.think,
      tools: {},
      abortSignal: params.abortSignal,
    });

    return {
      content: result.text,
      inputTokens: result.totalUsage?.inputTokens || undefined,
      outputTokens: result.totalUsage?.outputTokens || undefined,
    };
  }
}
