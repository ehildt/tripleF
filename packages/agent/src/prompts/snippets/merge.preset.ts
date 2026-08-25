import { z } from 'zod';

import { safeMediaUrlOrEmpty, safeVideoUrlOrEmpty } from '../../schemas/index.js';
import { createTextItemSchema } from '../../schemas/index.js';
import { HERO_VIDEO_TITLE_ISSUE, heroVideoHasTitle } from '../../schemas/index.js';

import { cardsSnippet } from './cards.snippet.js';
import { gallerySnippet } from './gallery.snippet.js';
import { headerArticleSnippet } from './header-article.snippet.js';
import { internationalCoverageSnippet } from './international-coverage.snippet.js';
import { keyFindingsSnippet } from './key-findings.snippet.js';
import { mergedEvaluationsSnippet } from './merged-evaluations.snippet.js';
import type { SnippetTemplatePreset } from './snippet.types.js';
import { sourcesSnippet } from './sources.snippet.js';
import { summarySnippet } from './summary.snippet.js';
import { videoGallerySnippet } from './video-gallery.snippet.js';

/**
 * MERGE preset: consolidates the previous requests and answers embedded in
 * the latest user message ([MERGE REQUEST] sections) into one response. The
 * model takes the snippets of the source answers and builds NEW enriched
 * snippets from them — all source video lists merge into one video gallery,
 * all image galleries into one gallery, all source lists into one sources
 * list, every comparison or critique into its own mergedEvaluations entry,
 * and same-topic narrative into one bodySections block per topic (topic
 * header plus structured snippet content). The special user request
 * (ADDITIONAL INSTRUCTION) renders as its own final body block.
 *
 * The full snippet union is exposed (including the evaluation snippets), so
 * the client's existing components render the merged output directly.
 *
 * The field shapes are reused from the base snippets (single source of
 * truth); only the instructions are rewritten for the merge contract — the
 * one exception is the body: it carries its own per-topic bodySections
 * shape defined below instead of the article's single-sectionContent shape.
 */
/**
 * One topic block of the merged narrative: its header, its own hero media
 * (a merge has no single hero — each topic shows its related visual), and
 * the snippet content the client renders as structured lists (pros, cons,
 * actions) with a plain-text fallback for material that cannot be
 * list-shaped.
 */
const bodySectionSchema = z
  .object({
    topic: z.string().min(1, {
      message: 'body sections must have a non-empty topic',
    }),
    content: z.string().optional(),
    strengths: z.array(createTextItemSchema('strengths')).optional(),
    weaknesses: z.array(createTextItemSchema('weaknesses')).optional(),
    recommendations: z.array(createTextItemSchema('recommendations')).optional(),
    heroImageUrl: safeMediaUrlOrEmpty(),
    heroImageAlt: z.string().optional(),
    heroCaption: z.string().optional(),
    heroVideoUrl: safeVideoUrlOrEmpty(),
    heroVideoTitle: z.string().optional(),
    heroVideoCaption: z.string().optional(),
  })
  .refine(heroVideoHasTitle, HERO_VIDEO_TITLE_ISSUE);

export const mergePreset: SnippetTemplatePreset = {
  template: 'merge',
  spineKeys: ['title', 'summary'],
  supportedLayouts: ['classic'],
  readTimeKeys: ['title', 'summary', 'bodySections'],
  snippets: [
    {
      fields: {},
      instruction: `MERGE CONTRACT
- The latest user message embeds the selected requests and answers to consolidate ([MERGE REQUEST] parts [1], [2], ... and an ADDITIONAL INSTRUCTION at the end). Each ASSISTANT ANSWER carries the original response as its FULL structured JSON — merge those snippet fields, never copy the JSON verbatim.
- Take the snippets of those selected requests and answers and build NEW enriched snippets from them, merging per kind: all source video lists merge into ONE videoGalleryItems snippet, all image galleries into ONE galleryItems snippet, all source lists into ONE sources snippet, all key findings into ONE keyFindings snippet, the merged narrative goes into ONE bodySections array (one block per topic, with its topic header, its own hero media, and its snippet content), and every comparison or critique into its OWN mergedEvaluations entry.
- EVERY selected prompt counts the same: consolidate the content of each selected answer with equal depth — details from the second or third selected answer are merged with the same completeness as the first; nothing from any selected prompt is dropped.
- Emit the JSON fields of every snippet kind the merged material contains — the client renders each field with its own component. Evaluation material is reproduced as mergedEvaluations entries (one per match-up, including unrelated ones), not as prose.
- Pieces that have nothing in common are explicitly marked as unrelated and STILL rendered as their own parts.
- NOTHING IS DROPPED: the merged video gallery, image gallery, and sources list contain EVERY unique video, image, and source URL from the merged material (deduplicated) — count them and match the count; dropping entries is a contract violation.
- The ADDITIONAL INSTRUCTION is a special user request: render its answer as the LAST bodySections block (a final topic with the special request as its topic line), plus any media or sources it produced.
- This is NOT a recap or summary of the material — reproduce the consolidated content itself in the snippet fields.`,
    },
    {
      ...headerArticleSnippet,
      instruction: `SNIPPET header (client hero title block):
- category: a short label for the consolidated material (e.g. "Merged", "Consolidated").
- title: a concise, descriptive headline covering ALL merged topics. REQUIRED, non-empty.
- subtitle: an optional one-line description of what was merged; omit when it adds nothing.`,
    },
    {
      ...summarySnippet,
      instruction: `SNIPPET lead (client lead paragraph):
- summary: a 1-2 sentence lead that names what was merged and the topics it covers. REQUIRED, non-empty.
- This is the lead, NOT a recap of the source content: the consolidated content itself lives in the snippet fields below.`,
    },
    mergedEvaluationsSnippet,
    {
      ...keyFindingsSnippet,
      instruction: `SNIPPET key findings (client observation cards):
- Merge the observations from all combined parts into 0-5 short observations, deduplicating repeats. Each entry is an object with exactly one key: "text".`,
    },
    {
      fields: {
        sectionTitle: z.string().optional(),
        bodySections: z.array(bodySectionSchema).optional(),
      },
      instruction: `SNIPPET body sections (client per-topic blocks — the merged depth):
- bodySections: an array of per-topic blocks, one entry per topic in the merged narrative. Each entry carries its topic header plus STRUCTURED snippet content the client renders as proper lists — never prose where a list fits.
- topic: the concise topic heading (e.g. "Nvidia RTX 5090"). REQUIRED, non-empty.
- HERO MEDIA PER TOPIC (a merge has no single hero — each topic shows its own related visual): heroImageUrl/heroImageAlt/heroCaption or heroVideoUrl/heroVideoTitle/heroVideoCaption. heroVideoUrl wins over heroImageUrl when both exist; when heroVideoUrl is set, heroVideoTitle is REQUIRED (copied from the source material); heroImageUrl set ⇒ heroImageAlt MUST be a non-empty descriptive label. Media URLs come from the embedded conversation material — never invent URLs; omit when the topic has no usable media. A topic's hero media must NOT be repeated in the galleries or sources.
- strengths: the topic's pros — 0-5 entries, each exactly { "text": "..." }.
- weaknesses: the topic's cons — 0-5 entries, each exactly { "text": "..." }.
- recommendations: 0-5 actionable points for this topic — each exactly { "text": "..." }.
- content: plain-text narrative ONLY for material that cannot be expressed as those snippets (background, comparisons in prose, context); prefer the structured snippets whenever the material is list-shaped. Plain text only — no markdown.
- Merge same-topic material from the selected answers into ONE block, deduplicating repeat points; pieces with nothing in common stay in separate blocks with an explicit note in content that they have nothing in common.
- Comparisons and critiques belong in mergedEvaluations, NOT here — their subject pros/cons live in the evaluation subject profiles.
- This is the content itself, not a summary of it — compress structure, never information.`,
    },
    {
      ...cardsSnippet,
      instruction: `SNIPPET cards (client link-card grid):
- Needs: distinct worthwhile URLs left over after the primary content, galleries, and sources are filled.
- Merge the link collections from the combined material; never reuse a URL already used in sources, galleries, or topic hero media. Omit when nothing distinct remains.`,
    },
    {
      ...sourcesSnippet,
      instruction: `SNIPPET sources (client sources list):
- MERGE all source lists from the combined material into one consolidated list, deduplicating by URL.
- sources entries: url and title (the minimum), plus sourceName, date, and snippet when the source material provides them.
- This is a merge request — re-citing the conversation's vetted sources is expected, unlike normal requests. Never invent sources.`,
    },
    {
      ...gallerySnippet,
      instruction: `SNIPPET image gallery (client image band):
- MERGE all image galleries from the combined material into ONE consolidated galleryItems array. EVERY image URL present in the combined material MUST appear as its own entry — never drop or skip an image the material contains (except images already used as a topic hero in bodySections — never repeat a topic's hero in the gallery).
- galleryItems entries: { imageUrl, imageAlt, title, caption } — one image per entry, imageAlt and title MUST be non-empty, deduplicate by URL.
- Omit the keys ONLY when the combined material contains no image at all; never invent images.`,
    },
    {
      ...videoGallerySnippet,
      instruction: `SNIPPET video gallery (client video grid):
- MERGE all video lists from the combined material into ONE consolidated videoGalleryItems array — the union of every unique video, each as its own entry (except videos already used as a topic hero in bodySections — never repeat those).
- NOTHING IS DROPPED: count the unique video URLs across the merged sections — the gallery must contain exactly that many entries (plus any fresh videos current tool results produced for the ADDITIONAL INSTRUCTION). If the material lists 11 unique videos, the gallery has 11 entries. Videos from the material belong here, not only in the sources list.
- One video per entry — never cram several videos into one entry. Deduplicate by video ID (watch?v=...), keeping the first occurrence.
- Each entry: { videoUrl, title, caption } with title and caption copied from the source material (non-empty, never generic filler); carry over duration, channel, date, views, thumbnailUrl, and description when the source material provides them.
- This is a merge request — the "videoSearch results only" rule is waived: the URLs come from vetted conversation material. Supported providers or direct video files only; never invent URLs. Omit the keys only when the combined material holds no videos.`,
    },
    {
      ...internationalCoverageSnippet,
      instruction: `SNIPPET international coverage (client aside):
- Needs: noteworthy other-language finds from the merged material (fresh research tool results when the ADDITIONAL INSTRUCTION asked for it).
- Same contract as usual; omit when nothing applies.`,
    },
  ],
};
