import { Injectable } from '@nestjs/common';

import {
  CLUSTER_PROBE_LIMIT,
  CONVICTION_PROBE_LIMIT,
  EPISODE_PROBE_LIMIT,
  EPISODE_TAG,
  INSIGHT_TAG,
} from '../../../memory-client/constants/memory-client.constants.js';
import { MemoryCognitionService } from '../../../memory-client/services/memory-cognition.service.js';
import { MemoryPartitionRecordsService } from '../../../memory-client/services/memory-partition-records.service.js';
import { flattenProfilePaths } from '../../helpers/cognition/flatten-profile-paths.helper.js';
import { matchProfilePaths } from '../../helpers/cognition/match-profile-paths.helper.js';
import { splitCognitionProfile } from '../../helpers/cognition/split-cognition-profile.helper.js';
import type { HarnessContext } from '../harness-context.type.js';

import type { SanitizeCognitionContextResult } from './cognition-context.service.types.js';

/** Topic-probe fan-out: at most this many derived insights enter the respond context. */
const COGNITION_PROBE_LIMIT = 3;

/** Builds the personalization and graph-recall context for one sanitize pass. */
@Injectable()
export class SanitizeCognitionContextService {
  constructor(
    private readonly memoryRecords: MemoryPartitionRecordsService,
    private readonly memoryCognition: MemoryCognitionService,
  ) {}

  /**
   * Load the structured profile and probe prompt-related insights,
   * convictions, episodes, and clusters. Read failures degrade to empty
   * context because personalization must never fail a turn.
   */
  async getContext(
    ctx: HarnessContext,
  ): Promise<SanitizeCognitionContextResult> {
    const cognitionKey =
      ctx.memoryCognition ?? ctx.memoryPartition ?? ctx.sessionId;
    if (!cognitionKey) {
      return { insights: [], convictions: [], episodes: [], clusters: [] };
    }
    try {
      const snapshot = await this.memoryCognition.getCognition(cognitionKey);
      const profile = snapshot.profile
        ? (JSON.parse(snapshot.profile) as Record<string, unknown> | undefined)
        : undefined;
      const prompt = ctx.lastUserPrompt?.trim();

      // Persona/corrections describe the AI; the rest models the user.
      const { persona, corrections, userProfile } =
        splitCognitionProfile(profile);
      const personaText = persona ? JSON.stringify(persona) : undefined;
      const correctionsText = corrections
        ? JSON.stringify(corrections)
        : undefined;
      const userProfileText = userProfile
        ? JSON.stringify(userProfile)
        : undefined;

      if (!prompt) {
        return {
          profile: userProfileText,
          persona: personaText,
          corrections: correctionsText,
          insights: [],
          convictions: [],
          episodes: [],
          clusters: [],
        };
      }

      // Profile values that token-match the prompt sharpen the memory probes.
      const matched = matchProfilePaths(prompt, flattenProfilePaths(profile));
      const cognitionQuery =
        matched.length > 0
          ? `${prompt}\nUser profile signals: ${matched.map((match) => `${match.path}: ${match.value}`).join('; ')}`
          : prompt;

      let insights: string[] = [];
      if (snapshot.insights.length > 0) {
        // Insight records are tag-addressed rather than partition-addressed.
        const hits = await this.memoryRecords.searchByText({
          text: cognitionQuery,
          tags: [INSIGHT_TAG],
          limit: COGNITION_PROBE_LIMIT,
        });
        insights = hits.map((hit) =>
          hit.isFriction
            ? `${hit.text} — ⚠ CONTESTED (an open conflict exists; treat with caution)`
            : hit.text,
        );
      }

      const convictions =
        (snapshot.convictions?.length ?? 0) > 0
          ? (
              await this.memoryCognition.searchConvictions({
                memoryCognition: cognitionKey,
                text: cognitionQuery,
                limit: CONVICTION_PROBE_LIMIT,
              })
            ).map((hit) =>
              hit.isFriction
                ? `${hit.text} — ⚠ CONTESTED (an open conflict exists; treat with caution)`
                : hit.text,
            )
          : [];

      // Episodes use the raw prompt and recency blending; zero disables them.
      const episodeProbeLimit =
        snapshot.episodeProbeLimit ?? EPISODE_PROBE_LIMIT;
      const episodeHits =
        episodeProbeLimit > 0
          ? await this.memoryRecords.searchByText({
              text: prompt,
              tags: [EPISODE_TAG],
              recency: true,
              limit: episodeProbeLimit,
            })
          : [];

      const clusters = ctx.filters.graphRag
        ? await this.probeClusters(ctx, prompt)
        : [];

      return {
        profile: userProfileText,
        persona: personaText,
        corrections: correctionsText,
        insights,
        convictions,
        episodes: episodeHits.map((hit) => hit.text),
        clusters,
      };
    } catch {
      return { insights: [], convictions: [], episodes: [], clusters: [] };
    }
  }

  /** Search facts and attach bounded cluster summaries for graph-augmented recall. */
  private async probeClusters(
    ctx: HarnessContext,
    prompt: string,
  ): Promise<string[]> {
    const partition = ctx.memoryPartition ?? ctx.sessionId;
    if (!partition) return [];
    const { clusters } = await this.memoryRecords.searchByTextWithClusters({
      memoryPartition: partition,
      text: prompt,
      limit: CLUSTER_PROBE_LIMIT,
    });
    return clusters
      .slice(0, CLUSTER_PROBE_LIMIT)
      .map((cluster) => `${cluster.title}: ${cluster.summary}`);
  }
}
