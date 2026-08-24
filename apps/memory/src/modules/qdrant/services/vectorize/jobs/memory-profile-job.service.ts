import { Injectable, Logger } from '@nestjs/common';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { OllamaConfigService } from '../../../../ai-sdk/configs/ollama-config.service.js';
import { AiSdkService } from '../../../../ai-sdk/services/ai-sdk.service.js';
import {
  buildMemoryProfilePrompt,
  MEMORY_PROFILE_INSTRUCTIONS,
} from '../../../constants/memory-profile-prompt.constant.js';
import type { MemoryProfileJobData } from '../../../models/memory.model.js';
import {
  isAllFieldsNullWipe,
  type MemoryCognitionProfile,
  type MemoryProfileResponse,
  memoryProfileResponseSchema,
  mergeCognitionProfiles,
} from '../../../models/memory-cognition.model.js';
import { MemoryCognitionService } from '../../memory-cognition.service.js';
import { MemoryOverridesService } from '../../memory-overrides.service.js';
import { MemorySearchService } from '../../memory-search.service.js';

/**
 * Cognition-profile job handler (vectorize queue): maintains the AI's own
 * memory of THIS user — one structured profile document plus derived insight
 * records. Deliberately a dedicated LLM call fed the turn's two sides, the
 * current profile, the space's derived insights, and this user's probed
 * prior facts (cross-conversation connective tissue); runs in the background
 * queue, so a cognition hiccup costs a BullMQ retry, never a turn.
 *
 * The verdict's profile is a PATCH merged over the stored document in code
 * (mergeCognitionProfiles): omitted fields survive, null fields are removed,
 * everything else replaces — only changed fields travel, and nothing stored
 * is dropped unless the patch says so.
 *
 * Not classifier-gated: derived understanding accrues from ordinary turns
 * ("subconscious formation" — the user never asks for it). profile: null +
 * empty insights is a correct, complete no-op outcome.
 */
@Injectable()
export class MemoryProfileJobService {
  private readonly logger = new Logger(MemoryProfileJobService.name);

  /** Bounded insight read for the job's context — the prompt builder truncates further. */
  private static readonly PROFILE_INSIGHT_CONTEXT_LIMIT = 30;

  /** Bounded prior-facts probe for the job's context — connective cues for cross-conversation insights. */
  private static readonly FACT_PROBE_LIMIT = 5;

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly ollamaConfigService: OllamaConfigService,
    private readonly memoryCognition: MemoryCognitionService,
    private readonly memoryOverrides: MemoryOverridesService,
    private readonly memorySearch: MemorySearchService,
  ) {}

  async execute(data: MemoryProfileJobData): Promise<void> {
    const scope = {
      memoryCognition: data.memoryCognition,
      sessionId: data.sessionId,
      conversationId: data.conversationId,
      requestId: data.requestId,
    };
    const limit = this.memoryOverrides.getCognitionLimit();
    const current = await this.memoryCognition.getProfile(data.memoryCognition);
    // The job's third input: the space's derived insights. The profile is a
    // routing map and the insights are its depth — the model sees both so it
    // can promote durable topics it already knows into the profile instead of
    // re-deriving them from a single turn (a sparse profile stays sparse
    // otherwise: the job only ever saw CURRENT PROFILE + one turn).
    const insights = await this.memoryCognition.listInsights(
      data.memoryCognition,
      MemoryProfileJobService.PROFILE_INSIGHT_CONTEXT_LIMIT,
    );
    // The job's fourth input: the user's OWN fact statements probed by this
    // turn's topic — the connective tissue for cross-conversation insights.
    // A failed probe degrades to no prior facts (searchByText never throws).
    const priorFacts = data.memoryPartition
      ? await this.memorySearch.searchByText({
          memoryPartition: data.memoryPartition,
          text: data.userRequest,
          limit: MemoryProfileJobService.FACT_PROBE_LIMIT,
        })
      : [];

    const { text } = await this.aiSdkService.generateChat({
      model: data.model,
      messages: [
        { role: 'system', content: MEMORY_PROFILE_INSTRUCTIONS },
        {
          role: 'user',
          content: buildMemoryProfilePrompt({
            userRequest: data.userRequest,
            assistantResponse: data.assistantResponse,
            currentProfile:
              current && Object.keys(current).length > 0
                ? JSON.stringify(current)
                : undefined,
            insights: insights.map((point) => ({
              text: point.text,
              path: point.path,
            })),
            priorFacts: priorFacts.map((point) => ({ text: point.text })),
            limit,
          }),
        },
      ],
      think: false,
      tools: {},
      keepAlive: this.ollamaConfigService.config.keepAlive,
      numCtx: data.numCtx,
    });

    const verdict = this.parseVerdict(text);
    if (!verdict) {
      // A garbage verdict of a fixed payload is not a transient fault —
      // retrying the identical call burns model tokens on the same outcome
      // (small models echo prose, chatty refusals arrive on NSFW turns).
      // Log with a raw preview for diagnosability, then skip the turn:
      // cognition learning is best-effort by design. Genuine infrastructure
      // failures (embed/store/Postgres/Qdrant) still throw → retry → DLQ.
      this.logger.warn(
        `memory-profile ${data.requestId}: verdict unparseable — turn skipped. Raw preview: ${(text ?? '').slice(0, 200)}`,
      );
      return;
    }

    let storedProfile = false;
    let removals: string[] = [];
    if (verdict.profile) {
      const outcome = await this.storeMergedProfile(
        scope,
        verdict.profile,
        limit,
        data.requestId,
      );
      storedProfile = outcome.stored;
      removals = outcome.removals;
    }
    const storedInsights = verdict.insights.length
      ? await this.memoryCognition.upsertInsights(scope, verdict.insights)
      : 0;

    if (!storedProfile && storedInsights === 0) {
      this.logger.debug(
        `memory-profile ${data.requestId}: nothing durable learned`,
      );
      return;
    }
    this.logger.log(
      `memory-profile ${data.requestId}: profile ${
        storedProfile
          ? removals.length > 0
            ? `merged (removed: ${removals.join(', ')})`
            : 'merged'
          : 'unchanged'
      }, ${storedInsights} insight(s) stored`,
    );
  }

  /**
   * Resolve a profile verdict patch over the freshest stored document and
   * store the result. Two guards keep a bad verdict from damaging the
   * document: an all-null wipe is rejected (explicit forget requests empty
   * the document through the memoryDelete tool first, so a full wipe
   * reaching the merge means the model mis-read "omit unchanged fields" as
   * "reset the document") and an over-cap merge keeps the old document (the
   * limit is the valve — never truncate JSON mid-structure, never retry a
   * condition a retry cannot fix).
   */
  private async storeMergedProfile(
    scope: {
      memoryCognition: string;
      sessionId?: string;
      conversationId?: string;
      requestId?: string;
    },
    patch: MemoryCognitionProfile,
    limit: number,
    requestId: string,
  ): Promise<{ stored: boolean; removals: string[] }> {
    // Re-read AFTER the model call so the merge base is as fresh as possible
    // (the vectorize worker's default concurrency is 2 — profile jobs can
    // overlap); with the profile in Postgres the read-merge-write tail is a
    // single atomic row upsert.
    const fresh = await this.memoryCognition.getProfile(scope.memoryCognition);
    if (isAllFieldsNullWipe(fresh, patch)) {
      this.logger.warn(
        `memory-profile ${requestId}: patch nulls every stored field — suspicious full wipe, keeping the stored document`,
      );
      return { stored: false, removals: [] };
    }
    const merged = mergeCognitionProfiles(fresh, patch);
    if (merged.profile === undefined) {
      return { stored: false, removals: merged.removals };
    }
    const serialized = JSON.stringify(merged.profile);
    if (serialized.length > limit) {
      this.logger.warn(
        `memory-profile ${requestId}: merged profile exceeds the ${limit}-char cap — keeping the old document`,
      );
      return { stored: false, removals: merged.removals };
    }
    await this.memoryCognition.storeProfile(scope, merged.profile, limit);
    return { stored: true, removals: merged.removals };
  }

  /** Tolerant parse + schema validation; undefined when the answer is unusable. */
  private parseVerdict(
    text: string | undefined,
  ): MemoryProfileResponse | undefined {
    if (!text?.trim()) return undefined;
    try {
      const parsed = memoryProfileResponseSchema.safeParse(parseLlmJson(text));
      return parsed.success ? parsed.data : undefined;
    } catch {
      return undefined;
    }
  }
}
