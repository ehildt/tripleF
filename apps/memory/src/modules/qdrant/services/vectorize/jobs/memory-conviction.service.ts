import { Injectable, Logger } from '@nestjs/common';
import {
  buildConvictionSynthesisPrompt,
  CONVICTION_INSTRUCTIONS,
} from '@triplef/agent/prompts';
import { AiSdkService } from '@triplef/ai-sdk';

import { OllamaConfigService } from '../../../../ai-sdk/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../../../ai-sdk/helpers/provider-options.helper.js';
import { BRIDGE_TAG } from '../../../constants/conviction.constant.js';
import { classifyStaleConvictions } from '../../../helpers/classify-stale-convictions.helper.js';
import { deterministicPointId } from '../../../helpers/deterministic-point-id.helper.js';
import { parseConvictionSynthesis } from '../../../helpers/parse-conviction-synthesis.helper.js';
import type { MemoryConvictionJobData } from '../../../models/memory.model.js';
import { EmbeddingService } from '../../embedding.service.js';
import { MemoryRepository } from '../../memory.repository.js';
import { MemoryCognitionService } from '../../memory-cognition.service.js';
import { MemoryEnqueueService } from '../../memory-enqueue.service.js';
import { MemoryOverridesService } from '../../memory-overrides.service.js';

/** Hard cap on evidence points offered per run (mirrors the reflect sweep). */
const MAX_EVIDENCE_PER_RUN = 500;

/**
 * Conviction-synthesis job handler (vectorize queue): the cross-lane
 * reflection step that synthesizes durable, higher-level statements from the
 * user's curated facts — each statement picks its lane by purpose:
 * - `conviction` — a durable conclusion about the user/self model, stored in
 *   the COGNITION scope (recalled by the respond-time conviction probe).
 * - `bridge` — a synthesized claim that closes a gap between the partition's
 *   facts, stored in the PARTITION scope WITH links (semantic kNN edges plus
 *   `evidence` edges to the facts it bridges — connective graph tissue).
 *
 * One LLM call per run over a bounded evidence batch; the model cites
 * evidence by ORDINAL position and the parser maps those citations to real
 * point ids (the model never emits raw ids — provenance is deterministic).
 * Every stored statement carries its `evidence_ids` back-references, so it
 * is always traceable to the facts that support it.
 *
 * Eligibility gate: evidence must be `is_reflected=true` (passed the friction
 * screen) and not yet `is_synthesized` — the lifecycle chain is store →
 * consolidate/relink → reflect → synthesize. A crash mid-run resumes from
 * the oldest synthesizable point because only successfully-offered evidence
 * is marked `is_synthesized`.
 *
 * Failure philosophy (matches the reflect job): Qdrant/embed errors propagate
 * to BullMQ (retry); an unparseable verdict leaves the evidence synthesizable
 * (self-heals on the next run, never burns retries on a deterministic
 * failure).
 */
@Injectable()
export class MemoryConvictionService {
  private readonly logger = new Logger(MemoryConvictionService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly ollamaConfigService: OllamaConfigService,
    private readonly embeddingService: EmbeddingService,
    private readonly memoryRepository: MemoryRepository,
    private readonly memoryCognition: MemoryCognitionService,
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly overrides: MemoryOverridesService,
  ) {}

  async execute(data: MemoryConvictionJobData): Promise<void> {
    // The cognition scope convictions store into — the harness's own default
    // (cognition key falls back to the partition key).
    const memoryCognition = data.memoryCognition ?? data.memoryPartition;

    // Drift-check first (G4): supersede statements whose evidence went stale
    // and re-offer their surviving evidence so the queue converges. Skipped
    // in dryRun — the sweep is a write, and dryRun promises no writes.
    if (!data.dryRun) {
      await this.sweepStaleConvictions(data.memoryPartition, memoryCognition);
    }

    const limit = Math.min(data.limit ?? 100, MAX_EVIDENCE_PER_RUN);
    const evidence = await this.memoryRepository.scrollSynthesizable({
      memoryPartition: data.memoryPartition,
      limit,
    });
    if (evidence.length === 0) {
      this.logger.debug(
        `memory-conviction ${data.memoryPartition}: nothing synthesizable`,
      );
      return;
    }

    const { text } = await this.aiSdkService.generateChat({
      model: data.model,
      messages: [
        { role: 'system', content: CONVICTION_INSTRUCTIONS },
        {
          role: 'user',
          content: buildConvictionSynthesisPrompt(evidence),
        },
      ],
      providerOptions: buildProviderOptions({
        think: false,
        keepAlive: this.ollamaConfigService.config.keepAlive,
      }),
      tools: {},
    });

    const statements = parseConvictionSynthesis(
      text,
      evidence,
      data.maxConvictionsPerCluster ?? 5,
    );
    if (statements === undefined) {
      this.logger.warn(
        `memory-conviction ${data.memoryPartition}: verdict unparseable — evidence left synthesizable`,
      );
      return;
    }

    const convictions = statements.filter(
      (statement) => statement.target === 'conviction',
    );
    const bridges = statements.filter(
      (statement) => statement.target === 'bridge',
    );

    if (data.dryRun) {
      this.logger.log(
        `memory-conviction ${data.memoryPartition} [dryRun]: ${convictions.length} conviction(s), ${bridges.length} bridge(s) from ${evidence.length} evidence`,
      );
      return;
    }

    // A valid verdict with zero statements still reviewed the evidence — mark
    // it synthesized so the work queue advances (re-offering the same batch
    // every run is wasted model time; new evidence forms new batches).
    if (statements.length === 0) {
      await this.memoryRepository.setPayloadForPoints(
        evidence.map((item) => item.id),
        { is_synthesized: true },
      );
      this.logger.log(
        `memory-conviction ${data.memoryPartition}: no statements from ${evidence.length} evidence`,
      );
      return;
    }

    const bridgesStored = await this.storeBridges(
      data.memoryPartition,
      bridges,
    );
    const convictionsStored = await this.memoryCognition.upsertConvictions(
      { memoryCognition },
      convictions.map((conviction) => ({
        text: conviction.text,
        evidenceIds: conviction.evidenceIds,
      })),
    );

    await this.memoryRepository.setPayloadForPoints(
      evidence.map((item) => item.id),
      { is_synthesized: true },
    );

    this.logger.log(
      `memory-conviction ${data.memoryPartition}: ${convictionsStored} conviction(s), ${bridgesStored} bridge(s) from ${evidence.length} evidence`,
    );

    await this.autoTriggerCluster(data.memoryPartition, data.model);
  }

  /**
   * Auto-trigger the cluster-detection sweep over the partition after a
   * real conviction run — the bridge evidence edges changed the link graph,
   * so the clusters re-cluster. Gated by clusterAutoEnabled; the model
   * falls back to the conviction model when no dedicated cluster model is
   * configured.
   */
  private async autoTriggerCluster(
    memoryPartition: string,
    fallbackModel: string,
  ): Promise<void> {
    if (!this.overrides.getClusterAutoEnabled()) return;
    await this.memoryEnqueue.enqueueClusterJob({
      lane: 'partition',
      scopeKey: memoryPartition,
      model: this.overrides.getClusterModel() ?? fallbackModel,
      minMembers: this.overrides.getClusterMinMembers(),
    });
  }

  /**
   * Embed + store the bridge statements: partition-scoped, `bridge`-tagged,
   * linked into the graph (semantic kNN edges and `evidence` edges to the
   * bridged facts — a bridge exists to CONNECT, so it never skips links).
   * Bridges stay out of the fact recall path (searchBridges is their read).
   */
  private async storeBridges(
    memoryPartition: string,
    bridges: Array<{ text: string; evidenceIds: string[] }>,
  ): Promise<number> {
    if (bridges.length === 0) return 0;
    const vectors = await this.embeddingService.embed(
      bridges.map((bridge) => bridge.text),
      'document',
    );
    if (vectors.length !== bridges.length) {
      throw new Error('Embedding returned fewer vectors than bridges');
    }

    await this.memoryRepository.upsertBatch({
      memoryPartition,
      role: 'assistant',
      points: bridges.map((bridge, index) => ({
        id: deterministicPointId(`${memoryPartition}|bridge|${bridge.text}`),
        vector: vectors[index],
        text: bridge.text,
        tags: [BRIDGE_TAG],
        evidenceIds: bridge.evidenceIds,
      })),
    });
    return bridges.length;
  }

  /**
   * Evidence-drift invariant (G4): a synthesized statement is stale iff any
   * of its `evidence_ids` is missing or superseded. This pre-pass supersedes
   * stale statements (bridges AND convictions) and clears `is_synthesized`
   * on their surviving evidence so those facts re-enter the synthesis queue
   * — the system converges instead of silently hiding decayed statements.
   */
  private async sweepStaleConvictions(
    memoryPartition: string,
    memoryCognition: string,
  ): Promise<void> {
    const [bridges, convictions] = await Promise.all([
      this.memoryRepository.scrollBridges(memoryPartition),
      this.memoryRepository.scrollConvictions(memoryCognition),
    ]);
    const statements = [...bridges, ...convictions];
    if (statements.length === 0) return;

    const evidenceIds = new Set(
      statements.flatMap((statement) => statement.evidenceIds),
    );
    const state = await this.memoryRepository.retrieveSupersededState([
      ...evidenceIds,
    ]);
    const { staleConvictionIds, reofferIds } = classifyStaleConvictions(
      statements,
      state,
    );

    if (staleConvictionIds.length > 0) {
      await this.memoryRepository.setPayloadForPoints(staleConvictionIds, {
        superseded: true,
      });
    }
    if (reofferIds.length > 0) {
      await this.memoryRepository.setPayloadForPoints(reofferIds, {
        is_synthesized: false,
      });
    }
    if (staleConvictionIds.length > 0) {
      this.logger.log(
        `memory-conviction ${memoryPartition}: superseded ${staleConvictionIds.length} stale statement(s), re-offered ${reofferIds.length} evidence`,
      );
    }
  }
}
