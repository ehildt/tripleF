import { Injectable } from '@nestjs/common';

import {
  CLUSTER_PROBE_LIMIT,
  COGNITION_PROBE_LIMIT,
  CONVICTION_PROBE_LIMIT,
  EPISODE_PROBE_LIMIT,
  EPISODE_TAG,
  INSIGHT_TAG,
} from '../../memory-client/constants/memory-client.constants.js';
import { MemoryCognitionService } from '../../memory-client/services/memory-cognition.service.js';
import { MemoryPartitionRecordsService } from '../../memory-client/services/memory-partition-records.service.js';
import { flattenProfilePaths } from '../helpers/cognition/flatten-profile-paths.helper.js';
import { matchProfilePaths } from '../helpers/cognition/match-profile-paths.helper.js';
import { splitCognitionProfile } from '../helpers/cognition/split-cognition-profile.helper.js';

import type { CognitionContextResult } from './cognition-context.service.types.js';
import type { HarnessContext } from './harness-context.type.js';

/** Builds the user's profile and recalled cognition context for one respond turn. */
@Injectable()
export class CognitionContextService {
  constructor(
    private readonly memoryRecords: MemoryPartitionRecordsService,
    private readonly memoryCognition: MemoryCognitionService,
  ) {}

  /**
   * Load the structured profile once and probe insights, convictions,
   * episodes, and graph clusters for the current prompt. Read failures
   * degrade to no injection so personalization cannot fail a turn.
   */
  async buildContext(ctx: HarnessContext): Promise<CognitionContextResult> {
    const cognitionKey =
      ctx.memoryCognition ?? ctx.memoryPartition ?? ctx.sessionId;
    if (!cognitionKey)
      return { insights: [], convictions: [], episodes: [], clusters: [] };

    try {
      const snapshot = await this.memoryCognition.getCognition(cognitionKey);
      const profile = snapshot.profile
        ? (JSON.parse(snapshot.profile) as Record<string, unknown> | undefined)
        : undefined;
      const prompt = ctx.lastUserPrompt?.trim();

      // Persona/corrections describe the assistant; the remaining document
      // is the user-side model and routing map into deeper cognition.
      const { persona, corrections, userProfile } =
        splitCognitionProfile(profile);
      const personaText = persona ? JSON.stringify(persona) : undefined;
      const correctionsText = corrections
        ? JSON.stringify(corrections)
        : undefined;
      const userProfileText = userProfile
        ? JSON.stringify({
            ...(Object.keys(snapshot.profileHeat ?? {}).length > 0
              ? { retrievalHeat: snapshot.profileHeat }
              : {}),
            ...userProfile,
          })
        : undefined;

      if (!prompt)
        return {
          profile: userProfileText,
          persona: personaText,
          corrections: correctionsText,
          insights: [],
          convictions: [],
          episodes: [],
          clusters: [],
        };

      // Token-matched profile paths sharpen the semantic probes with the
      // user's own routing map while the episode probe keeps the raw prompt.
      const matched = matchProfilePaths(prompt, flattenProfilePaths(profile));
      const cognitionQuery =
        matched.length > 0
          ? `${prompt}\nUser profile signals: ${matched.map((match) => `${match.path}: ${match.value}`).join('; ')}`
          : prompt;

      let insights: string[] = [];
      if (snapshot.insights.length > 0) {
        const hits = await this.memoryRecords.searchByText({
          memoryCognition: cognitionKey,
          text: cognitionQuery,
          tags: [INSIGHT_TAG],
          weightByHeat: true,
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

      const episodeProbeLimit =
        snapshot.episodeProbeLimit ?? EPISODE_PROBE_LIMIT;

      const episodeHits =
        episodeProbeLimit > 0
          ? await this.memoryRecords.searchByText({
              memoryCognition: cognitionKey,
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

  /** Recall fact hits and attach their detected cluster summaries. */
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
