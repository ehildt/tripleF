import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  buildMemoryProfilePrompt,
  MEMORY_PROFILE_INSTRUCTIONS,
} from '@triplef/agent/prompts';
import {
  isAllFieldsNullWipe,
  type MemoryCognitionProfile,
  type MemoryProfileResponse,
  memoryProfileResponseSchema,
  mergeCognitionProfiles,
} from '@triplef/agent/schemas';
import { AiSdkService } from '@triplef/ai-sdk';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { OllamaConfigService } from '../../../../ollama/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../../../ollama/helpers/provider-options.helper.js';
import { QDRANT_CONFIG } from '../../../constants/qdrant.constants.js';
import { derivePayloadChars } from '../../../helpers/derive-payload-chars.helper.js';
import type { MemoryProfileJobData } from '../../../models/memory.model.js';
import type { QdrantConfig } from '../../../models/qdrant-config.model.js';
import { MemoryCognitionService } from '../../memory-cognition.service.js';
import { MemoryEnqueueService } from '../../memory-enqueue.service.js';
import { MemoryOverridesService } from '../../memory-overrides.service.js';
import { MemorySearchService } from '../../memory-search.service.js';

import { mapPointToInsight } from './helpers/map-point-to-insight.helper.js';
import { mapPointToPriorFact } from './helpers/map-point-to-prior-fact.helper.js';
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
    private readonly memoryEnqueue: MemoryEnqueueService,
    @Inject(QDRANT_CONFIG) private readonly qdrantConfig: QdrantConfig,
  ) {}

  async execute(data: MemoryProfileJobData): Promise<void> {
    const scope = {
      memoryCognition: data.memoryCognition,
      sessionId: data.sessionId,
      conversationId: data.conversationId,
      requestId: data.requestId,
    };
    const limit = this.memoryOverrides.getCognitionLimit();
    const maxPayloadChars = derivePayloadChars(
      data.numCtx,
      this.qdrantConfig.profilePayloadRatio,
      this.qdrantConfig.profilePayloadChars,
    );
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
    // The space's stored convictions — the synthesis lane's conclusions the
    // profile job may promote into the profile's convictions facet.
    const convictions = await this.memoryCognition.listConvictions(
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
            insights: insights.map(mapPointToInsight),
            convictions: convictions.map((conviction) => ({
              text: conviction.text,
            })),
            priorFacts: priorFacts.map(mapPointToPriorFact),
            limit,
            maxPayloadChars,
          }),
        },
      ],
      providerOptions: buildProviderOptions({
        think: false,
        keepAlive: this.ollamaConfigService.config.keepAlive,
        numCtx: data.numCtx,
      }),
      tools: {},
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
    const storedEpisode = verdict.episode
      ? await this.memoryCognition.upsertEpisode(scope, verdict.episode)
      : 0;

    if (!storedProfile && storedInsights === 0 && storedEpisode === 0) {
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
      }, ${storedInsights} insight(s), ${storedEpisode} episode(s) stored`,
    );

    await this.autoTriggerReflect(data.memoryCognition, data.model);
  }

  /**
   * Auto-trigger the reflection sweep over the cognition space after a real
   * profile job — newly stored insights are unreflected, so the friction
   * screen picks them up. Gated by cognitionReflectAutoEnabled; the model
   * falls back to the profile job's (turn) model when no dedicated reflection
   * model is configured.
   */
  private async autoTriggerReflect(
    memoryCognition: string,
    fallbackModel: string,
  ): Promise<void> {
    if (!this.memoryOverrides.getCognitionReflectAutoEnabled()) return;
    await this.memoryEnqueue.enqueueReflectJob({
      lane: 'cognition',
      scopeKey: memoryCognition,
      model: this.memoryOverrides.getReflectModel() ?? fallbackModel,
      limit: this.memoryOverrides.getReflectBatchLimit(),
      maxCandidates: this.memoryOverrides.getReflectMaxCandidates(),
    });
  }

  /**
   * Resolve a profile verdict patch over the freshest stored document and
   * store the result. Two guards keep a bad verdict from damaging the
   * document: an all-null wipe is rejected (explicit forget requests empty
   * the document through the memory-cognition-forget tool first, so a full wipe
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
