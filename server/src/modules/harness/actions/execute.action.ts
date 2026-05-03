import { Inject, Injectable, Logger } from '@nestjs/common';

import { OllamaConfigService } from '../../../configs/ollama-config.service.js';
import type { InputMessage } from '../../ai-sdk/helpers/ai-sdk-message.models.js';
import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import { ToolSelectionService } from '../../ai-sdk/services/tool-selection.service.js';
import { type FilterVariant } from '../../sharp/helpers/image-variant.helper.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { FastifyMultipartMeta } from '../dtos/harness-job.dto.js';
import { buildFilenames } from '../helpers/build-filenames.helper.js';
import { isEmbeddableVideoUrl } from '../helpers/is-embeddable-video-url.helper.js';
import { isTrustedImageUrl } from '../helpers/is-trusted-image-url.helper.js';
import {
  type ToolName,
  type VariantName,
} from '../helpers/tool-registry.helper.js';
import { type HarnessContext } from '../services/harness-context.type.js';
import { MediaUrlValidatorService } from '../services/media-url-validator.service.js';

export type ExecuteResult = {
  buffers: Buffer[];
  processedMeta: FastifyMultipartMeta[];
  messages: InputMessage[];
  toolResults: Array<{ toolName: string; result: unknown }>;
  inputTokens?: number;
  outputTokens?: number;
  availableImageCount: number;
  availableVideoCount: number;
};

@Injectable()
export class ExecuteActionService {
  private readonly logger = new Logger(ExecuteActionService.name);

  constructor(
    @Inject(AiSdkService)
    private readonly aiSdkService: AiSdkService,
    @Inject(ToolSelectionService)
    private readonly toolSelectionService: ToolSelectionService,
    @Inject(SharpService)
    private readonly sharpService: SharpService,
    @Inject(MediaUrlValidatorService)
    private readonly mediaUrlValidator: MediaUrlValidatorService,
    @Inject(OllamaConfigService)
    private readonly ollamaConfigService: OllamaConfigService,
  ) {}

  /**
   * Phase 2 – Execute.
   *
   * Carries out the plan from the interpret step:
   * - resizes images
   * - generates requested preprocessing variants
   * - invokes external tools and variant-request tools
   *
   * Returns processed images, updated messages, and tool results.
   */
  async execute(
    ctx: HarnessContext,
    abortSignal?: AbortSignal,
  ): Promise<ExecuteResult> {
    const intent = ctx.outputs.intent;
    if (!intent) throw new Error('Missing intent — execute cannot run');

    const hasImages = ctx.buffers.length > 0;
    const imagePlan = intent.plan?.images;
    const preprocessing = ctx.filters.preprocessing;

    let buffers = ctx.buffers;
    let processedMeta = ctx.processedMeta;

    // 1. Resize images (default true when images are present)
    if (hasImages && imagePlan?.resize !== false) {
      const resized = await this.sharpService.resizeImages(
        buffers,
        processedMeta,
        preprocessing,
      );
      buffers = resized.map((r) => r.buffer);
      processedMeta = resized.map((r) => r.meta);
    }

    // 2. Determine which variant tools are available and which were requested
    const availableVariants = this.getAvailableVariants(preprocessing);
    const requestedVariants = (imagePlan?.variants ?? []).filter((v) =>
      availableVariants.includes(v as VariantName),
    ) as FilterVariant[];

    // 3. Build the tool set: external tools + variant request tools
    const externalToolNames = (intent.tools ?? []).filter(
      (t): t is ToolName => !t.startsWith('request'),
    );
    const variantToolNames =
      requestedVariants.length > 0
        ? requestedVariants.map(
            (v) => `request${this.capitalize(v)}` as ToolName,
          )
        : [];

    const allToolNames = [...externalToolNames, ...variantToolNames];
    const chosenTools =
      allToolNames.length > 0
        ? this.toolSelectionService.selectToolsByName(
            allToolNames,
            undefined,
            undefined,
            availableVariants,
          )
        : {};

    // 4. Run the tool model call with resized images
    let toolResults: Array<{ toolName: string; result: unknown }> = [];
    let inputTokens = 0;
    let outputTokens = 0;

    if (Object.keys(chosenTools).length > 0) {
      const executeMessages = this.buildExecuteMessages(
        ctx,
        buffers,
        processedMeta,
        availableVariants,
      );

      const result = await this.aiSdkService.generateWithTools({
        model: ctx.model,
        messages: executeMessages,
        keepAlive: this.ollamaConfigService.config.keepAlive,
        numCtx: ctx.request.options?.num_ctx,
        think: ctx.request.think,
        tools: chosenTools as any,
        abortSignal,
      });

      toolResults = result.toolResults;
      inputTokens = result.totalUsage?.inputTokens ?? 0;
      outputTokens = result.totalUsage?.outputTokens ?? 0;

      if (toolResults.length === 0) {
        this.logger.warn({
          request: 'execute-no-tool-calls',
          requestId: ctx.requestId,
          model: ctx.model,
          textPreview: result.text?.slice(0, 300),
        });
      }

      const missingResults = await this.invokeMissingMandatoryTools(
        chosenTools,
        ctx,
        toolResults,
      );
      if (missingResults.length > 0) {
        toolResults.push(...missingResults);
        this.logger.log({
          request: 'execute-missing-tools-invoked',
          requestId: ctx.requestId,
          tools: missingResults.map((r) => r.toolName),
        });
      }

      // Identify variant requests from tool results
      const requestedFromTools = toolResults
        .filter((tr) => tr.toolName.startsWith('request'))
        .map((tr) => (tr.result as { variant?: string }).variant)
        .filter((v): v is string => !!v) as FilterVariant[];

      requestedVariants.push(
        ...requestedFromTools.filter((v) => !requestedVariants.includes(v)),
      );
    }

    // 5. Generate the requested variant images
    if (requestedVariants.length > 0 && hasImages) {
      const variantImages = await this.sharpService.generateVariants(
        buffers,
        processedMeta,
        requestedVariants,
        preprocessing,
      );
      buffers = [...buffers, ...variantImages.map((v) => v.buffer)];
      processedMeta = [...processedMeta, ...variantImages.map((v) => v.meta)];
    }

    // 6. Verify and filter media URLs before sending them to the model
    const rawImageItems = this.extractImageSearchUrls(toolResults);
    const rawVideoItems = this.extractVideoSearchUrls(toolResults);
    let { images: verifiedImages, videos: verifiedVideos } =
      await this.filterVerifiedMedia(rawImageItems, rawVideoItems);

    // Cap verified media to the requested/target counts so the model never
    // sees more URLs than it is allowed to use. The defaults are 6.
    const imageTargetCount = intent?.imageCount > 0 ? intent.imageCount : 6;
    const videoTargetCount = intent?.videoCount > 0 ? intent.videoCount : 6;
    verifiedImages = verifiedImages.slice(0, imageTargetCount);
    verifiedVideos = verifiedVideos.slice(0, videoTargetCount);

    // 7. Rebuild final messages with processed images + tool results
    const finalMessages = await this.buildFinalMessages(
      ctx,
      buffers,
      processedMeta,
      toolResults,
      verifiedImages,
      verifiedVideos,
    );

    this.logger.log('[HARNESS] tool results summary', {
      requestId: ctx.requestId,
      model: ctx.model,
      toolCount: toolResults.length,
      invokedTools: toolResults.map((tr) => tr.toolName),
      articleCount: this.extractArticles(toolResults).length,
      availableImageCount: verifiedImages.length,
      availableVideoCount: verifiedVideos.length,
      sampleImageUrls: verifiedImages.slice(0, 3).map((i) => i.imageUrl),
      sampleVideoUrls: verifiedVideos.slice(0, 3).map((v) => v.videoUrl),
    });

    return {
      buffers,
      processedMeta,
      messages: finalMessages,
      toolResults,
      inputTokens: inputTokens || undefined,
      outputTokens: outputTokens || undefined,
      availableImageCount: verifiedImages.length,
      availableVideoCount: verifiedVideos.length,
    };
  }

  private getAvailableVariants(preprocessing?: {
    enabled?: boolean;
    variants?: Record<string, boolean>;
  }): VariantName[] {
    if (!preprocessing?.enabled) return [];

    return Object.entries(preprocessing.variants ?? {})
      .filter(([, enabled]) => enabled)
      .map(([name]) => name as VariantName);
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private buildExecuteMessages(
    ctx: HarnessContext,
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
    availableVariants: VariantName[],
  ): InputMessage[] {
    const baseSystem = ctx.request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');

    const isImageTask = buffers.length > 0;
    const executePrompt = isImageTask
      ? this.buildImageExecutePrompt(availableVariants)
      : this.buildToolExecutePrompt(ctx.outputs.intent);

    const system = [baseSystem, executePrompt].filter(Boolean).join('\n\n');

    return [
      { role: 'system', content: system },
      ...this.buildConversationMessages(ctx, buffers, meta),
    ];
  }

  private buildConversationMessages(
    ctx: HarnessContext,
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
  ): InputMessage[] {
    const imageOnlyMarker = /^Image\(s\):/;

    const conversation = ctx.request.messages.filter(
      (m) =>
        m.role !== 'system' &&
        !(
          m.role === 'user' &&
          m.images?.length &&
          imageOnlyMarker.test(m.content)
        ),
    );

    if (buffers.length === 0) {
      return conversation;
    }

    const marker =
      buffers.length === 1
        ? '[1 image attached]'
        : `[${buffers.length} images attached]`;

    const lastUserIndex = conversation.findLastIndex((m) => m.role === 'user');

    if (lastUserIndex >= 0) {
      const original = conversation[lastUserIndex];
      conversation[lastUserIndex] = {
        ...original,
        content: `${original.content}\n\n${marker}`,
        images: buffers,
      };
    } else {
      const filenames = buildFilenames(
        meta as Parameters<typeof buildFilenames>[0],
      );
      conversation.push({
        role: 'user',
        content: `Image(s):\n${filenames}\n\n${marker}`,
        images: buffers,
      });
    }

    return conversation;
  }

  private buildImageExecutePrompt(availableVariants: VariantName[]): string {
    const variantLine =
      availableVariants.length > 0
        ? `Available image variants you may request: ${availableVariants.join(', ')}.`
        : 'No additional image variants are available.';

    return [
      'You are selecting preprocessing variants and optional external tools for an image task.',
      'The resized image(s) are attached to the latest user message.',
      variantLine,
      'Only call external tools if the user explicitly asked for external data.',
      'Only request image variants if they would materially improve your analysis.',
      "If the user's request is vague and does not specify external data, focus on describing or analyzing the provided image(s).",
      'FINAL REMINDER:',
      '- Only call external tools if the user explicitly asked for external data; otherwise focus on describing or analyzing the provided image(s).',
    ].join(' ');
  }

  private buildToolExecutePrompt(
    intent?: HarnessContext['outputs']['intent'],
  ): string {
    const tools = intent?.tools ?? [];
    const toolList =
      tools.length > 0
        ? `MANDATORY tools you MUST call: ${tools.join(', ')}.`
        : 'No tools are selected.';

    const imageCountLine = intent?.imageCount
      ? `imageCount: retrieve ${intent.imageCount} image(s). Only pass this count to *ImageSearch tools; if omitted, each tool defaults to 6.`
      : '';
    const videoCountLine = intent?.videoCount
      ? `videoCount: retrieve ${intent.videoCount} video(s). Only pass this count to *VideoSearch tools; if omitted, each tool defaults to 6.`
      : '';
    const countInstruction = intent?.imageCount
      ? `For *ImageSearch tools, pass count equal to imageCount.`
      : intent?.videoCount
        ? `For *VideoSearch tools, pass count equal to videoCount.`
        : 'Do not pass a count to search tools unless imageCount or videoCount is provided above; each tool will default to 6.';

    return [
      'You are a deterministic tool execution engine.',
      'You have already selected the tools needed for this task.',
      toolList,
      imageCountLine,
      videoCountLine,
      'Your ONLY job is to call every mandatory tool with an appropriate input.',
      'Do not answer the user, do not explain, and do not produce JSON in this step.',
      'Derive the search query or target URL for each tool from the latest user message and the conversation context.',
      'Each mandatory tool must be called at least once. Missing a mandatory tool is a failure.',
      countInstruction,
      'Example tool call format: { "toolName": "webSearch", "input": { "query": "..." } }',
      'Return ONLY tool calls. No prose.',
      'FINAL REMINDER:',
      '- Call every mandatory tool at least once and return ONLY tool calls; no prose, no explanations, no JSON deliverables.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  private async invokeMissingMandatoryTools(
    chosenTools: Record<string, unknown>,
    ctx: HarnessContext,
    existingResults: Array<{ toolName: string; result: unknown }>,
  ): Promise<Array<{ toolName: string; result: unknown }>> {
    const invoked = new Set(existingResults.map((tr) => tr.toolName));
    const mandatory = (ctx.outputs.intent?.tools ?? []).filter(
      (t) => !t.startsWith('request') && !invoked.has(t),
    );
    if (mandatory.length === 0) return [];

    const query = this.extractSearchQuery(ctx);
    const intent = ctx.outputs.intent;
    const results: Array<{ toolName: string; result: unknown }> = [];

    for (const toolName of mandatory) {
      const toolDef = chosenTools[toolName];
      const tool = toolDef as {
        execute?: (input: unknown) => Promise<unknown>;
      };
      if (!tool.execute) continue;

      const input = this.buildFallbackInput(
        toolName,
        query,
        intent?.imageCount,
        intent?.videoCount,
      );
      if (input === undefined) continue;

      try {
        const result = await tool.execute(input);
        results.push({ toolName, result });
      } catch (err) {
        this.logger.warn({
          request: 'execute-missing-tool-error',
          requestId: ctx.requestId,
          toolName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  }

  private buildFallbackInput(
    toolName: string,
    query: string,
    imageCount?: number,
    videoCount?: number,
  ): unknown | undefined {
    if (toolName === 'webFetch' || toolName.endsWith('WebpageFetch')) {
      return undefined;
    }

    if (toolName === 'wikipediaGetPage') {
      return undefined;
    }

    if (toolName.endsWith('ImageSearch')) {
      return imageCount && imageCount > 0
        ? { query, count: imageCount }
        : { query };
    }

    if (toolName.endsWith('VideoSearch') || toolName.endsWith('NewsSearch')) {
      return videoCount && videoCount > 0
        ? { query, count: videoCount }
        : { query };
    }

    if (
      toolName === 'webSearch' ||
      toolName.endsWith('WebSearch') ||
      toolName === 'wikipediaSearch' ||
      toolName === 'hackerNewsSearch' ||
      toolName === 'browserbaseSearch' ||
      toolName === 'searxngSearch'
    ) {
      return { query };
    }

    return undefined;
  }

  private extractSearchQuery(ctx: HarnessContext): string {
    const lastUser = [...ctx.request.messages]
      .reverse()
      .find((m) => m.role === 'user' && !m.content.startsWith('Image(s):'));
    const rawQuery =
      lastUser?.content?.trim() ?? ctx.lastUserPrompt?.trim() ?? '';
    const contextSummary = ctx.outputs.intent?.contextSummary?.trim() ?? '';

    // When the latest message is just a vague follow-up ("these", "this",
    // "search online", "compare"), the real subject lives in the prior context
    // summary. Prefer the summary so image/video searches find relevant media.
    const words = rawQuery.split(/\s+/).filter(Boolean);
    const isVagueFollowUp =
      words.length < 5 ||
      /\b(these|those|this|that|sie|dies|das|den|dem|search\s+online|online\s+search)\b/i.test(
        rawQuery,
      );
    const hasConcreteSubject =
      /\b(?:Stellar|Blade|Gothic|Nioh|game|movie|film|book|product|company|person|artist|album)\b/i.test(
        rawQuery,
      );

    if (contextSummary && isVagueFollowUp && !hasConcreteSubject) {
      return contextSummary.slice(0, 250).replace(/\s+/g, ' ').trim();
    }

    return rawQuery.slice(0, 300);
  }

  private async buildFinalMessages(
    ctx: HarnessContext,
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
    toolResults: Array<{ toolName: string; result: unknown }>,
    verifiedImages: Array<{ imageUrl: string; title?: string }>,
    verifiedVideos: Array<{ videoUrl: string; title?: string }>,
  ): Promise<InputMessage[]> {
    const messages: InputMessage[] = [
      ...ctx.request.messages.filter((m) => m.role === 'system'),
      ...this.buildConversationMessages(ctx, buffers, meta),
    ];

    if (toolResults.length === 0) {
      return messages;
    }

    const articles = this.extractArticles(toolResults);
    const references = this.extractReferences(toolResults);

    const imageCount = verifiedImages.length;
    const videoCount = verifiedVideos.length;

    const intent = ctx.outputs.intent;
    const imageTargetCount = intent?.imageCount > 0 ? intent.imageCount : 6;
    const videoTargetCount = intent?.videoCount > 0 ? intent.videoCount : 6;

    const toolContext = {
      availableImages: verifiedImages,
      availableVideos: verifiedVideos,
      articles,
      references,
      imageTargetCount,
      videoTargetCount,
      mediaInstructions: [
        `You have ${imageCount} image URL(s) in availableImages and ${videoCount} video URL(s) in availableVideos.`,
        `Target counts: use at most ${imageTargetCount} image(s) and ${videoTargetCount} video(s) in the final response. If the user explicitly requested a number, that is the target. Otherwise the target is 6.`,
        'You MUST use these exact URLs in the response JSON. Do not ignore them.',
        'Pick heroImageUrl from the FIRST availableImages entry when no video is available; pick heroVideoUrl from the FIRST availableVideos entry when any video is available.',
        `Take the next image URLs from availableImages and put them in galleryItems (skip the hero image URL). Do not exceed ${imageTargetCount} images total across heroImageUrl and galleryItems.`,
        `Take the next video URLs from availableVideos and put them in videoGalleryItems (skip the hero video URL). Do not exceed ${videoTargetCount} videos total across heroVideoUrl and videoGalleryItems.`,
        'If fewer URLs are available than the target, include all of them.',
        'When choosing which URLs to keep, prefer video URLs discovered inside webSearch article results first, then URLs from videoSearch. Prefer image URLs from imageSearch results first.',
        'Each galleryItems entry must be an object with imageUrl, imageAlt, title, and caption.',
        'Each videoGalleryItems entry must be an object with videoUrl, title, and caption.',
        'If image or video URLs are present, leaving heroImageUrl, heroVideoUrl, galleryItems, or videoGalleryItems empty is a failure.',
        'Use articles for facts and sources, and use availableImages/availableVideos for media.',
        'Never fabricate URLs; only use URLs listed in availableImages or availableVideos.',
        'VIDEO PROVIDER RESTRICTION: only use video URLs from supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other platforms that cannot be embedded reliably.',
        'IMAGE DOMAIN RESTRICTION: only use image URLs from trusted sources. Reject Google thumbnail proxies (encrypted-tbn*.gstatic.com, t*.gstatic.com), data URIs, localhost, private IPs, and unknown hosts without a direct image file extension.',
        'IMAGE RESOLUTION RESTRICTION: only use image URLs that are at least 1280×720 (720p). Prefer 2560×1440 (1440p). Do not use low-resolution news thumbnails for gallery or card images.',
      ],
    };

    const toolContextMessage: InputMessage = {
      role: 'user',
      content: `Retrieved articles and media (JSON):\n${JSON.stringify(
        toolContext,
        null,
        2,
      )}`,
    };

    this.logger.log('[HARNESS] tool context message', {
      requestId: ctx.requestId,
      messageLength: toolContextMessage.content.length,
      imageCount: verifiedImages.length,
      videoCount: verifiedVideos.length,
      articleCount: articles.length,
    });

    return [...messages, toolContextMessage];
  }

  private extractArticles(
    toolResults: Array<{ toolName: string; result: unknown }>,
  ): Array<Record<string, unknown>> {
    const articles: Array<Record<string, unknown>> = [];
    const seen = new Set<string>();

    for (const tr of toolResults) {
      const data = tr.result as
        | {
            results?: Array<{
              title?: string;
              snippet?: string;
              url?: string;
              source?: string;
              date?: string;
              description?: string;
              link?: string;
              imageUrl?: string;
            }>;
          }
        | undefined;
      if (!data?.results) continue;

      for (const r of data.results) {
        const url = r.url || r.link;
        if (!url || seen.has(url)) continue;
        seen.add(url);

        const sourceName = this.deriveSourceName(url, r.source);
        const articleImageUrl = r.imageUrl || '';
        articles.push({
          title: r.title || '',
          snippet: r.snippet || r.description || '',
          url,
          sourceName,
          date: r.date || '',
          imageUrl: isTrustedImageUrl(articleImageUrl) ? articleImageUrl : '',
        });
      }
    }

    return articles;
  }

  private extractReferences(
    toolResults: Array<{ toolName: string; result: unknown }>,
  ): unknown[] {
    return toolResults
      .filter((tr) => !this.isSearchLikeTool(tr.toolName))
      .map((tr) => this.truncateToolResult(tr.result));
  }

  private isSearchLikeTool(toolName: string): boolean {
    return (
      toolName.endsWith('ImageSearch') ||
      toolName.endsWith('VideoSearch') ||
      toolName.endsWith('NewsSearch') ||
      toolName === 'webSearch' ||
      toolName.endsWith('WebSearch') ||
      toolName === 'wikipediaSearch' ||
      toolName === 'hackerNewsSearch' ||
      toolName === 'browserbaseSearch' ||
      toolName === 'searxngSearch'
    );
  }

  private deriveSourceName(url: string, rawSource?: string): string {
    const providerSlugs = new Set(['serper', 'brave']);
    if (rawSource && !providerSlugs.has(rawSource.toLowerCase())) {
      return rawSource;
    }

    try {
      const hostname = new URL(url).hostname
        .toLowerCase()
        .replace(/^www\./, '');
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const commonSubdomains = new Set(['news', 'blog', 'amp', 'm', 'www']);
        if (commonSubdomains.has(parts[0])) {
          return parts[1];
        }
      }
      return parts[0] || hostname;
    } catch {
      return rawSource || '';
    }
  }

  private extractVideoSearchUrls(
    toolResults: Array<{ toolName: string; result: unknown }>,
  ): Array<{ videoUrl: string; title?: string; fromWebSearch?: boolean }> {
    const candidates = toolResults.flatMap((tr) => this.videoCandidates(tr));
    const seen = new Set<string>();
    const webVideos: Array<{ videoUrl: string; title?: string }> = [];
    const videoSearchItems: Array<{ videoUrl: string; title?: string }> = [];

    for (const candidate of candidates) {
      const canonical =
        this.canonicalVideoId(candidate.videoUrl) || candidate.videoUrl;
      if (seen.has(canonical)) continue;
      seen.add(canonical);

      const item = { videoUrl: candidate.videoUrl, title: candidate.title };
      if (candidate.fromWebSearch) {
        webVideos.push(item);
      } else {
        videoSearchItems.push(item);
      }
    }

    return [
      ...webVideos.map((item) => ({ ...item, fromWebSearch: true })),
      ...videoSearchItems.map((item) => ({ ...item, fromWebSearch: false })),
    ];
  }

  private videoCandidates(tr: {
    toolName: string;
    result: unknown;
  }): Array<{ videoUrl: string; title?: string; fromWebSearch: boolean }> {
    const bucket = this.videoUrlBucket(tr.toolName);
    if (!bucket) return [];

    const data = tr.result as
      | {
          results?: Array<{
            videoUrl?: string;
            url?: string;
            link?: string;
            title?: string;
            snippet?: string;
          }>;
        }
      | undefined;
    if (!data?.results) return [];

    const items: Array<{ videoUrl: string; title?: string }> = [];
    for (const r of data.results) {
      const rawUrl = r.videoUrl || r.url || r.link;
      if (!rawUrl || !this.isVideoUrl(rawUrl)) continue;
      if (!isEmbeddableVideoUrl(rawUrl)) continue;
      items.push({ videoUrl: rawUrl, title: r.title });
    }

    return items.map((item) => ({
      ...item,
      fromWebSearch: bucket === 'web',
    }));
  }

  private videoUrlBucket(toolName: string): 'web' | 'video' | null {
    if (toolName.endsWith('VideoSearch')) return 'video';
    if (
      toolName === 'webSearch' ||
      toolName.endsWith('WebSearch') ||
      toolName.endsWith('NewsSearch')
    ) {
      return 'web';
    }
    return null;
  }

  private canonicalVideoId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const youtubeDomains = [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtu.be',
        'youtube-nocookie.com',
        'www.youtube-nocookie.com',
      ];

      if (youtubeDomains.includes(parsed.hostname)) {
        if (parsed.hostname === 'youtu.be') {
          return parsed.pathname.slice(1);
        }
        return parsed.searchParams.get('v') || '';
      }
      return null;
    } catch {
      return null;
    }
  }

  private isVideoUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const videoHosts = new Set([
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtu.be',
        'youtube-nocookie.com',
        'www.youtube-nocookie.com',
        'vimeo.com',
        'www.vimeo.com',
        'player.vimeo.com',
        'dailymotion.com',
        'www.dailymotion.com',
        'dai.ly',
        'loom.com',
        'www.loom.com',
        'wistia.com',
        'www.wistia.com',
        'home.wistia.com',
        'fast.wistia.net',
      ]);
      if (videoHosts.has(parsed.hostname)) return true;

      const videoExtensions =
        /\.(mp4|webm|ogg|mov|mkv|avi|flv|m3u8|mpd)(\?.*)?$/i;
      if (videoExtensions.test(parsed.pathname)) return true;

      return false;
    } catch {
      return false;
    }
  }

  private extractImageSearchUrls(
    toolResults: Array<{ toolName: string; result: unknown }>,
  ): Array<{ imageUrl: string; title?: string }> {
    const items: Array<{ imageUrl: string; title?: string }> = [];
    const seen = new Set<string>();

    for (const tr of toolResults) {
      if (!tr.toolName.endsWith('ImageSearch')) continue;

      const data = tr.result as
        | {
            results?: Array<{
              imageUrl?: string;
              title?: string;
            }>;
          }
        | undefined;
      if (!data?.results) continue;

      for (const r of data.results) {
        const url = r.imageUrl;
        if (!url || !isTrustedImageUrl(url) || seen.has(url)) continue;
        seen.add(url);
        items.push({ imageUrl: url, title: r.title });
      }
    }

    return items;
  }

  private async filterVerifiedMedia(
    rawImages: Array<{ imageUrl: string; title?: string }>,
    rawVideos: Array<{ videoUrl: string; title?: string }>,
  ): Promise<{
    images: Array<{ imageUrl: string; title?: string }>;
    videos: Array<{ videoUrl: string; title?: string }>;
  }> {
    const imageUrls = rawImages.map((item) => item.imageUrl);
    const videoUrls = rawVideos.map((item) => item.videoUrl);

    const [imageResults, videoResults] = await Promise.all([
      this.mediaUrlValidator.validateUrls(imageUrls, {
        enabled: true,
        timeoutMs: 3000,
        maxRedirects: 3,
        concurrency: 5,
      }),
      this.mediaUrlValidator.validateUrls(videoUrls, {
        enabled: true,
        timeoutMs: 3000,
        maxRedirects: 3,
        concurrency: 5,
      }),
    ]);

    const images: Array<{ imageUrl: string; title?: string }> = [];
    const videos: Array<{ videoUrl: string; title?: string }> = [];

    for (let i = 0; i < rawImages.length; i++) {
      const item = rawImages[i];
      const result = imageResults[i];
      if (!result || result.kind === 'broken') continue;

      if (result.kind === 'video') {
        videos.push({ videoUrl: item.imageUrl, title: item.title });
      } else {
        images.push(item);
      }
    }

    for (let i = 0; i < rawVideos.length; i++) {
      const item = rawVideos[i];
      const result = videoResults[i];
      if (!result || result.kind === 'broken') continue;

      if (result.kind === 'image') {
        images.push({ imageUrl: item.videoUrl, title: item.title });
      } else if (
        result.kind === 'html' &&
        !isEmbeddableVideoUrl(item.videoUrl)
      ) {
        continue;
      } else {
        videos.push(item);
      }
    }

    return { images, videos };
  }

  private truncateToolResult(result: unknown, maxChars = 8000): unknown {
    if (result === null || result === undefined) return result;
    if (typeof result !== 'object') return result;

    try {
      const text = JSON.stringify(result);
      if (text.length <= maxChars) return result;
      return {
        note: 'Tool result truncated',
        preview: text.slice(0, maxChars),
      };
    } catch {
      return result;
    }
  }
}
