import {
  DEFAULT_MEDIA_COUNT,
  isImageTaskTemplate,
} from '@triplef/agent/schemas';
import type { InputMessage } from '@triplef/ai-sdk';

import type { HarnessContext } from '../../services/harness-context.type.js';
import type { ExtractedArticle } from '../media/extract-articles-from-tools.types.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../media/extract-media-from-tools.types.js';
import type { ExtractedPlace } from '../media/extract-places.types.js';
import type { ExtractedReview } from '../media/extract-reviews.types.js';
import type { ExtractedShopOffer } from '../media/extract-shop-offers.types.js';

const INTERNATIONAL_POOLS_LINE =
  "internationalArticles and internationalVideos hold results in languages other than the user's — they feed only the internationalCoverage aside, never primary content (hero, galleries, sources, lists).";

function dedupeImages<T extends { imageUrl: string }>(images: T[]): T[] {
  const seen = new Set<string>();
  return images.filter((item) => {
    if (seen.has(item.imageUrl)) return false;
    seen.add(item.imageUrl);
    return true;
  });
}

/**
 * The past-research lane: verbatim passages from previously fetched sources,
 * injected as a separate context block (never shares the current-turn
 * selection budget). Empty when the probe found nothing.
 */
function buildEncyclopediaMessages(
  encyclopediaPassages: Array<{
    url?: string;
    title?: string;
    content: string;
    sourceType?: 'content' | 'result';
  }>,
): InputMessage[] {
  if (encyclopediaPassages.length === 0) return [];
  const content = encyclopediaPassages.filter((p) => p.sourceType !== 'result');
  const snippets = encyclopediaPassages.filter(
    (p) => p.sourceType === 'result',
  );
  const messages: InputMessage[] = [];

  if (content.length > 0) {
    messages.push({
      role: 'system' as const,
      content: `[RELEVANT KNOWLEDGE — PREVIOUSLY FETCHED SOURCES]\nVerbatim passages from sources you fetched in earlier research, selected for this request:\n${content
        .map(
          (passage) =>
            `- ${passage.title ? `${passage.title} — ` : ''}${passage.url ?? 'no url'}\n${passage.content}`,
        )
        .join(
          '\n',
        )}\nThese are verbatim source excerpts, not your own notes. Cite their url/title when you use them; never imply you read whole pages.`,
    });
  }

  if (snippets.length > 0) {
    messages.push({
      role: 'system' as const,
      content: `[RELEVANT KNOWLEDGE — PREVIOUSLY SEEN SOURCES]\nSearch-result snippets from sources you found in earlier research (NOT full text — fetch the page if you need more):\n${snippets
        .map(
          (passage) =>
            `- ${passage.title ? `${passage.title} — ` : ''}${passage.url ?? 'no url'}\n${passage.content}`,
        )
        .join(
          '\n',
        )}\nThese are snippets, not full pages. Cite their url/title when you use them; never imply you read whole pages.`,
    });
  }

  return messages;
}

/**
 * The AI's cognition of this user is always-on context: the structured
 * profile (who they are — durable traits, preferences, goals; also the
 * routing map into deeper memory) plus any path-matched insights (topic
 * depth the current prompt pulled up). Cognition is working context — it
 * informs every answer but is never quoted verbatim as user statements;
 * its substance may be disclosed plainly when asked or when it genuinely
 * serves the user. Fact records (memory-partition-recall) are the
 * user-facing lane.
 */
function buildCognitionMessages(
  persona?: string,
  corrections?: string,
  profile?: string,
  insights: string[] = [],
  convictions: string[] = [],
  episodes: string[] = [],
  clusters: string[] = [],
): InputMessage[] {
  const messages: InputMessage[] = [];
  if (persona?.trim()) {
    messages.push({
      role: 'system' as const,
      content: `[YOUR IDENTITY — WHO YOU ARE TO THIS USER]\nThe user has shaped your identity. Adopt it fully:\n${persona.trim()}\nThis is YOU, not the user. When the user calls you by your name or asks who you are, answer as yourself and acknowledge your name naturally. Never confuse your identity with the user's, and never treat your own name as a public figure or topic.`,
    });
  }
  if (corrections?.trim()) {
    messages.push({
      role: 'system' as const,
      content: `[YOUR LEARNED RULES — CORRECTIONS THE USER TAUGHT YOU]\nThe user corrected you in the past. Follow these rules going forward:\n${corrections.trim()}\nThese are behavioral rules for YOU, not facts about the user. Apply them silently and consistently.`,
    });
  }
  if (profile?.trim()) {
    messages.push({
      role: 'system' as const,
      content: `[YOUR PROFILE OF THIS USER — YOUR DERIVED UNDERSTANDING; INFORMS, NEVER QUOTES]\nYour self-learned model of this user (structured document, also your routing map into deeper cognition): ${profile.trim()}\nUse it silently to personalize tone, depth, and choices. Its interests, likes, and goals are STANDING traits, not recent activity — never answer "where did we leave off", "what were we doing", or any recent-activity question from this document; those are answered from your RECENT CONVERSATIONS memory or not at all. Never present it as something the user stated and never quote it verbatim — disclose its substance plainly when the user asks what you know about them or when it clearly serves them. It is their data, never public knowledge. If it holds nothing about what they are asking, say plainly that you do not have that information instead of improvising.`,
    });
  }
  if (insights.length > 0) {
    messages.push({
      role: 'system' as const,
      content: `[RELEVANT PRIVATE COGNITION — DERIVED, NEVER VERBATIM]\nDeeper understanding of this user that the current request pulled up from your cognition space (path-routed by your profile):\n${insights.map((insight) => `- ${insight}`).join('\n')}\nThese are YOUR working notes, never the user's words: they may inform your answer, they may never be quoted or cited as user statements. Share the substance only when it clearly serves the user — and if the request asks about something your memory holds nothing on, say plainly that you don't have that information rather than inventing it.`,
    });
  }
  if (convictions.length > 0) {
    messages.push({
      role: 'system' as const,
      content: `[YOUR CONVICTIONS — SYNTHESIZED, HOLD LOOSELY]\nConclusions you yourself synthesized from this user's memory (each rests on cited evidence; the synthesis is yours, never the user's words):\n${convictions.map((conviction) => `- ${conviction}`).join('\n')}\nThese are YOUR derived conclusions about the user's world and your relationship: let them inform your judgment and what you proactively connect, but never present them as facts the user stated, and hold them loosely — a conviction the user contradicts is wrong, not them. When a conviction clearly serves the answer, share its substance plainly as your own read, open to correction.`,
    });
  }
  if (episodes.length > 0) {
    messages.push({
      role: 'system' as const,
      content: `[RECENT CONVERSATIONS — YOUR SHORT-TERM MEMORY OF PAST TURNS]\nWhat you and the user were working on in recent turns (topic-matched, recency-weighted):\n${episodes.map((episode) => `- ${episode}`).join('\n')}\nThese are YOUR working notes on past turns, never the user's words. Use them for continuity — to pick up where a past turn left off — never quote them as user statements. When the user asks where you left off or what you were doing recently, answer from these notes — they are the authoritative source for recent activity; if none of them fits, say plainly that you don't have that activity in memory rather than guessing from the profile or general knowledge.`,
    });
  }
  if (clusters.length > 0) {
    messages.push({
      role: 'system' as const,
      content: `[TOPIC CONTEXT — CLUSTERS OF THIS USER'S MEMORY]\nSummaries of the memory clusters the current request touched (each is a synthesized overview of a group of related facts, not a single statement):\n${clusters.map((cluster) => `- ${cluster}`).join('\n')}\nThese are YOUR synthesized cluster overviews, never the user's words. Use them to see the shape of what the user cares about and to connect related facts across a topic — never quote them as user statements, and never treat a cluster summary as a specific fact the user stated. When a summary clearly serves the answer, draw on its substance as your own read of the user's memory.`,
    });
  }
  return messages;
}

/**
 * Media usage instructions injected into the tool context. Media-only list
 * templates (imagelist/videolist) have no hero media, so they get dedicated
 * instructions instead of the hero-oriented default.
 */
function buildMediaInstructions(
  template: string | undefined,
  imageCount: number,
  videoCount: number,
  imageTargetCount: number,
  videoTargetCount: number,
): string[] {
  if (template === 'imagelist') {
    return [
      `You have ${imageCount} image URL(s) in availableImages.`,
      INTERNATIONAL_POOLS_LINE,
      `Put every suitable image URL into galleryItems (at most ${imageTargetCount}). This template has NO hero image — every image lives in galleryItems.`,
      'Skip any imageUrl that already appeared in an earlier imagelist response in the conversation history ("Previously shown images") — never return images the user has already seen.',
      'You MUST use these exact URLs in the response JSON. Do not ignore them.',
      'Each galleryItems entry must be an object with imageUrl, imageAlt, title, and caption. imageAlt and title must be non-empty.',
      'Copy width, height, and source from the availableImages entries into each galleryItems entry.',
      'If media URLs are present, leaving galleryItems empty is a failure.',
      'RESOLUTION: all availableImages URLs are pre-verified — use them as provided, preferring the higher-resolution ones; do not omit a suitable URL for resolution.',
    ];
  }

  if (template === 'videolist') {
    return [
      `You have ${videoCount} video URL(s) in availableVideos.`,
      INTERNATIONAL_POOLS_LINE,
      `Put every suitable video URL into videoGalleryItems (at most ${videoTargetCount}), ordered like a playlist. This template has NO hero video — every video lives in videoGalleryItems.`,
      'Skip any videoUrl that already appeared in an earlier videolist response in the conversation history — never return videos the user has already seen.',
      'You MUST use these exact URLs in the response JSON. Do not ignore them.',
      'Each videoGalleryItems entry must be an object with videoUrl, title, and caption. title and caption must be non-empty.',
      'Copy duration, channel, date, views, thumbnailUrl, and description from the availableVideos entries into each videoGalleryItems entry.',
      'If media URLs are present, leaving videoGalleryItems empty is a failure.',
    ];
  }

  if (template === 'shoplist') {
    return [
      `You have ${imageCount} image URL(s) in availableImages.`,
      INTERNATIONAL_POOLS_LINE,
      'This template has NO hero media, NO galleries, and NO videos — images only appear as shopOffers[].imageUrl.',
      'Fill the shopOffers field from the shopOffers array in this context — every offer provides title, price, source, and link. Apply the link rules to each link (direct merchant URLs only, never Google links). Sort by ascending price.',
      "Attach the best matching product image from availableImages to each offer's imageUrl. The same product image may be reused across offers of the same product. Leave imageUrl empty when no image matches.",
      'If shopOffers is non-empty, leaving the shopOffers field empty is a failure.',
    ];
  }

  if (isImageTaskTemplate(template ?? '')) {
    return [
      `You have ${imageCount} image URL(s) in availableImages.`,
      'availableImages holds cloud reference candidates from imageSearch as DATA (title, source, dimensions) — their pixels are never attached to you. The uploaded user images travel as message attachments.',
      'Pick a candidate into galleryItems ONLY when its search-result data corroborates the subject you identified in the uploaded image(s) — name the textual signal behind every pick. Never include the uploaded user images; they are already visible to the user as attachments. A gallery without any cloud candidate is valid — never include one on weak or missing evidence.',
      'List every unpicked cloud candidate in discardedReferences with { "type": "image", imageUrl, title, reason } and a one-line reason; retrieved links that failed to corroborate may be listed with { "type": "link", url, title, reason }.',
      'Each galleryItems entry must be an object with imageUrl, imageAlt, title, and caption. imageAlt and title must be non-empty.',
      INTERNATIONAL_POOLS_LINE,
    ];
  }

  const productInstructions =
    template === 'product'
      ? [
          'Fill the shopOffers field from the shopOffers array in this context — every offer provides title, price, source, and link. Apply the link rules to each link (direct merchant URLs only, never Google links). Sort by ascending price.',
          'If shopOffers is non-empty, leaving the shopOffers field empty is a failure.',
        ]
      : [];

  const heroLine =
    template === 'product'
      ? 'Pick heroImageUrl from the best availableImages entry (the pool is ordered by relevance). This template has NO hero video — the banner is image-only, leave heroVideoUrl and heroVideoTitle empty.'
      : 'Pick heroImageUrl from the FIRST availableImages entry when no video is available; pick heroVideoUrl from the FIRST availableVideos entry. The pools are ordered by relevance.';

  return [
    `You have ${imageCount} image URL(s) in availableImages and ${videoCount} video URL(s) in availableVideos.`,
    `Target counts: use at most ${imageTargetCount} image(s) and ${videoTargetCount} video(s) in the final response.`,
    'You MUST use these exact URLs in the response JSON. Do not ignore them.',
    heroLine,
    'Take the next image URLs from availableImages for galleryItems (skip hero image URL). Do not exceed imageTargetCount.',
    `Take the next video URLs from availableVideos for videoGalleryItems. Do not exceed videoTargetCount.`,
    'If fewer URLs are available than target, include all of them.',
    'Prefer video URLs discovered inside *WebSearch article results first, then youtubeVideoSearch results, then other *VideoSearch sources.',
    INTERNATIONAL_POOLS_LINE,
    'Each galleryItems entry must be an object with imageUrl, imageAlt, title, and caption.',
    'Each videoGalleryItems entry must be an object with videoUrl, title, and caption.',
    'If media URLs are present, leaving gallery or hero fields empty is a failure.',
    'IMPORTANT: videos and images are INDEPENDENT. Using videos does NOT reduce the number of images to return.',
    'Use articles for facts and sources. Never fabricate URLs — only use availableImages/availableVideos.',
    'RESOLUTION: all availableImages URLs are pre-verified — use them as provided, preferring the higher-resolution ones; do not omit a suitable URL for resolution.',
    ...productInstructions,
  ];
}

/**
 * Build final messages for the sanitize step — includes full text instructions.
 */
export function buildFinalMessagesForSanitize(
  ctx: HarnessContext,
  buffers: Buffer[],
  toolResults: Array<{ toolName: string; result: unknown }>,
  verifiedImages: ExtractedImageItem[],
  verifiedVideos: ExtractedVideoItem[],
  extractedArticles: ExtractedArticle[],
  extractedReferences: unknown[],
  referencesSelection?: { considered: number; selected: number },
  encyclopediaPassages: Array<{
    url?: string;
    title?: string;
    content: string;
    sourceType?: 'content' | 'result';
  }> = [],
  extractedShopOffers: ExtractedShopOffer[] = [],
  extractedReviews: ExtractedReview[] = [],
  extractedPlaces: ExtractedPlace[] = [],
  internationalArticles: ExtractedArticle[] = [],
  internationalVideos: ExtractedVideoItem[] = [],
  cognitionProfile?: string,
  cognitionPersona?: string,
  cognitionCorrections?: string,
  cognitionInsights: string[] = [],
  cognitionConvictions: string[] = [],
  cognitionEpisodes: string[] = [],
  cognitionClusters: string[] = [],
): InputMessage[] {
  const conversation = ctx.request.messages.filter((m) => m.role !== 'system');

  if (buffers.length > 0) {
    const lastUserIndex = conversation.findLastIndex((m) => m.role === 'user');
    if (lastUserIndex >= 0) {
      const original = conversation[lastUserIndex];
      conversation[lastUserIndex] = {
        ...original,
        images: buffers,
      };
    } else {
      conversation.push({ role: 'user', content: '', images: buffers });
    }
  }

  const systemMessages = ctx.request.messages.filter(
    (m) => m.role === 'system',
  );

  const cognitionMessages = buildCognitionMessages(
    cognitionPersona,
    cognitionCorrections,
    cognitionProfile,
    cognitionInsights,
    cognitionConvictions,
    cognitionEpisodes,
    cognitionClusters,
  );
  const contextSystemMessages: InputMessage[] = [
    ...systemMessages,
    ...cognitionMessages,
    ...buildEncyclopediaMessages(encyclopediaPassages),
  ];

  if (toolResults.length === 0) {
    return [...contextSystemMessages, ...conversation];
  }

  const imageCount = verifiedImages.length;
  const videoCount = verifiedVideos.length;
  const intent = ctx.outputs.intent;
  const imageTargetCount =
    intent?.imageCount > 0 ? intent.imageCount : DEFAULT_MEDIA_COUNT;
  const videoTargetCount =
    intent?.videoCount > 0 ? intent.videoCount : DEFAULT_MEDIA_COUNT;
  const uniqueImages = dedupeImages(verifiedImages);

  const mediaInstructions = buildMediaInstructions(
    intent?.template,
    imageCount,
    videoCount,
    imageTargetCount,
    videoTargetCount,
  );

  if (extractedReferences.length > 0) {
    const referencesLine = referencesSelection
      ? `references holds the most relevant verbatim passages selected from ${referencesSelection.considered} fetched passages (${referencesSelection.considered - referencesSelection.selected} omitted as less relevant). Each passage carries its source url/title — cite those; never imply you read whole pages. `
      : 'The references array holds raw non-search tool results (e.g. fetched page contents). Use them for facts and sources; they never contain usable media URLs. ';
    mediaInstructions.push(
      referencesLine +
        'A memory-partition-recall result inside references is YOUR memory of the user — trusted statements they said or asked you to remember; answer from it directly and attribute it to the user.',
    );
  }

  const toolContextMessage: InputMessage = {
    role: 'system',
    content: `[TOOL CONTEXT — DO NOT OUTPUT]\n${JSON.stringify(
      {
        availableVideos: verifiedVideos,
        articles: extractedArticles,
        references: extractedReferences,
        shopOffers: extractedShopOffers,
        reviews: extractedReviews,
        places: extractedPlaces,
        internationalArticles,
        internationalVideos,
        // Images last: text data guides the response; images only fill media slots.
        availableImages: uniqueImages,
        imageTargetCount,
        videoTargetCount,
        mediaInstructions,
      },
      null,
      2,
    )}`,
  };

  return [...contextSystemMessages, toolContextMessage, ...conversation];
}
