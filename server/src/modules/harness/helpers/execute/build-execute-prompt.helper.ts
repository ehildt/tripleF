import type { IntentResult } from '../../templates/intent.schema.js';
import { type VariantName } from '../tools/tool-registry.constants.js';

import { buildLanguageInstruction } from './build-language-instruction.helper.js';
import { buildStockmarketNote } from './build-stockmarket-note.helper.js';

/** Check if a tool is not suitable for fallback invocation (static input only). */
export function isNoFallbackTool(toolName: string): boolean {
  return toolName === 'webFetch' || toolName.endsWith('WebpageScrape');
}

/** Check if a tool is a pure keyword-based search (no static URL input). */
export function isPureSearchTool(toolName: string): boolean {
  if (toolName.endsWith('ShoppingSearch')) return true;
  if (toolName.endsWith('ReviewsSearch')) return true;
  if (toolName.endsWith('PlacesSearch')) return true;
  return toolName.endsWith('WebSearch');
}

/** Add count and language to a search input base object. */
export function enrichSearchInput(
  base: Record<string, unknown>,
  count?: number,
  language?: string,
): void {
  if (count != null && count > 0) base.count = count;
  if (language) base.lang = language;
}

/**
 * Build the fallback input for a missing mandatory tool so it can be invoked directly with a search query.
 */
export function buildFallbackInput(
  toolName: string,
  query: string,
  imageCount?: number,
  videoCount?: number,
  language?: string,
): unknown | undefined {
  if (isNoFallbackTool(toolName)) return undefined;

  const base = Object.assign({} as Record<string, unknown>, { query });

  if (toolName.endsWith('ImageSearch')) {
    // Images are language-agnostic: never inject a locale/language here.
    // Only the model's explicit `lang` (for an explicit user request) is
    // honored by the tool itself.
    if (imageCount != null && imageCount > 0) base.count = imageCount;
    return base;
  }
  if (toolName.endsWith('VideoSearch') || toolName.endsWith('NewsSearch')) {
    enrichSearchInput(base, videoCount, language);
    return base;
  }
  if (isPureSearchTool(toolName)) {
    if (language) base.lang = language;
    return base;
  }

  return undefined;
}

/**
 * The non-negotiable contract for every search query argument. External
 * search engines only ever see the query string — never the conversation —
 * so each query must stand alone and name its subject explicitly. This is
 * the guard against verbatim follow-up messages ("what do the reviews
 * say?") leaking into tool arguments without their established subject.
 */
const STANDALONE_QUERY_RULES = `STANDALONE QUERY RULES (absolute — they apply to every search query you emit):
- Search engines only see the query string — never this conversation. Every query MUST be fully self-contained.
- ALWAYS name the subject explicitly: the exact entity (game, product, person, place, topic) the request is about, spelled out in every query of every parallel tool call.
- NEVER copy the latest user message into a query verbatim. Rewrite it into a proper search phrase that includes its subject.
- Short follow-ups ("what do the reviews say?", "more", "and the second one?", "was sagen die Tests dazu?") refer to an established subject — take that subject from the CONTEXT SUMMARY or earlier conversation turns and fold it into every query.
- Example: after a conversation about the game Neverness to Everness (NTE), the follow-up "what do the reviews say?" becomes "Neverness to Everness NTE reviews verdict" — never "what do the reviews say?".
- A query without its explicit subject is a failure, even when the phrasing matches the endpoint guidance below.
- Only when the latest message starts a NEW topic unrelated to earlier turns, ignore the earlier context and craft the query for the new topic alone.`;

/**
 * Per-endpoint query crafting guidance for the product template. Each Serper
 * endpoint performs best with a differently phrased query, so the model must
 * not reuse one generic query for all tools.
 */
const PRODUCT_QUERY_GUIDANCE = `QUERY CRAFTING (product task) — phrase each tool query for its endpoint; never reuse one query for all tools:
- Language: phrase descriptive query words (review/test/unboxing/specs) in the detected user language; keep product names, brand names, and model numbers verbatim.
- *ShoppingSearch: the bare product name with exact model number (e.g. "Sony WH-1000XM5"). No extra words like "buy", "price", or "review".
- *WebSearch: factual queries such as "<product> specifications" and "<product> review" for editorial reviews and facts.
- *ImageSearch: "<product>" optionally with "official" for clean product shots.
- *VideoSearch: "<product> review", "<product> hands-on", or "<product> unboxing".
- *WebpageScrape / webFetch: fetch the most authoritative review or spec page discovered by the *WebSearch results when snippets are insufficient.`;

/**
 * Per-endpoint query crafting guidance for non-product tasks.
 */
const GENERAL_QUERY_GUIDANCE = `QUERY CRAFTING — phrase each tool query for its endpoint; never reuse one query for all tools:
- Language: phrase descriptive query words in the detected user language; keep entity names (products, brands, people, places) verbatim.
- *WebSearch: precise factual queries with the key entities and qualifiers (version, model, location). Only add a year/recency qualifier when the FRESHNESS rules call for it — not for evergreen topics.
- *ReviewsSearch: reviews BUSINESSES only — call it with an exact business or place name, never with a product or topic.
- *PlacesSearch: phrase it like a Google Maps search — a business name or "<business type> in <location>".
- *ImageSearch: short visual descriptions of the subject.
- *VideoSearch: subject plus the video type (e.g. "review", "trailer", "tutorial"); vary queries between fresh and evergreen angles as the FRESHNESS rules describe.`;

/**
 * Build the system prompt for image execution tasks. Instructs the model to choose preprocessing variants and external tools.
 */
export function buildImageExecutePrompt(
  availableVariants: VariantName[],
  language?: string,
): string {
  const variantLine =
    availableVariants.length > 0
      ? `Available image variants you may request: ${availableVariants.join(', ')}.`
      : 'No additional image variants are available.';

  const langInstruction = language
    ? `Detected user language: ${language}. Use this language in all search queries and pass it to tools that accept a language/locale parameter (e.g. search_lang, hl, gl) when available. EXCEPTION: do NOT pass a language/locale to *ImageSearch tools — images are visual and language-agnostic, so a locale parameter only narrows results; omit it unless the user explicitly asked for images of a specific language.`
    : '';

  return `You are selecting preprocessing variants and optional external tools for an image task.
The resized image(s) are attached to the latest user message.
${variantLine}
${langInstruction ? `${langInstruction}\n` : ''}Your job in this step is NOT to answer the user. It is only to inspect the attached image(s) and decide which tools or variants are needed.
If external search tools are selected, identify the most useful visible signal (watermark, logo, text, character, outfit, location, object) and call the search tools with a query derived from that signal.
Every search query must be standalone: it explicitly names the subject (character, game, brand, place) by combining the visible signal with the established subject from the conversation or CONTEXT SUMMARY. Never emit a bare generic description or the user message verbatim.
Only call external tools if they were selected for this task.
Only request image variants if they would materially improve your analysis.
Do NOT write a final answer, explanation, or conclusion in this step.
FINAL REMINDER:
- Inspect the image(s), call the selected tools if needed, and request variants if useful. Return ONLY tool calls and variant requests; no prose answer.`;
}

/**
 * Build the system prompt for tool execution tasks. Instructs the model to call mandatory tools with appropriate inputs.
 */
export function buildToolExecutePrompt(intent?: IntentResult): string {
  const tools = intent?.tools ?? [];
  const toolList =
    tools.length > 0
      ? `MANDATORY tools you MUST call: ${tools.join(', ')}.`
      : 'No tools are selected.';

  const timestamp = new Date()
    .toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    .replace(' at ', ', ');

  const imageCountLine = intent?.imageCount
    ? `imageCount: retrieve ${intent.imageCount} image(s). Only pass this count to *ImageSearch tools; if omitted, each tool defaults to 6.`
    : '';
  const videoCountLine = intent?.videoCount
    ? `videoCount: retrieve ${intent.videoCount} video(s). Only pass this count to *VideoSearch tools; if omitted, each tool defaults to 6.`
    : '';

  const countInstruction = intent?.imageCount
    ? 'For *ImageSearch tools, pass count equal to imageCount.'
    : intent?.videoCount
      ? 'For *VideoSearch tools, pass count equal to videoCount.'
      : 'Do not pass a count to search tools unless imageCount or videoCount is provided above; each tool will default to 6.';

  const freshnessRules = `FRESHNESS (applies to every search query you emit):
- Current date and time: ${timestamp}.
- Anchor a query on freshness ONLY when the request is time-sensitive: news, "latest/recent/breaking", new releases, deals, trends, or an explicitly recent ask.
- For time-sensitive queries, prefer the tool's recency parameter (day|week|month|year) over stuffing a year into the query string; when a year qualifier fits, target the most recent year for which content actually exists — early in a calendar year, prior-year content is often more abundant and still current, so do not blindly use the current year.
- For evergreen or timeless requests (music/media playlists, how-tos, historical, conceptual, product specs, general facts), do NOT add a year qualifier — it filters out good results the user still wants.
- When a task benefits from both (e.g. media lists, comparisons), vary the parallel queries: some fresh/dated, some with no year, so coverage is not artificially narrowed.`;
  // The language comes from the intent classifier; when it could not detect
  // one, the tool model mirrors the user's latest message on its own.
  const langInstruction = buildLanguageInstruction(intent?.language);
  const queryGuidance =
    intent?.template === 'product' || intent?.template === 'shoplist'
      ? PRODUCT_QUERY_GUIDANCE
      : GENERAL_QUERY_GUIDANCE;

  const stockmarketNote = buildStockmarketNote(intent?.template);

  return `You are a deterministic tool execution engine.
You have already selected the tools needed for this task.
${toolList}
${freshnessRules}
${langInstruction ? `${langInstruction}\n` : ''}${imageCountLine ? `${imageCountLine}\n` : ''}${videoCountLine ? `${videoCountLine}\n` : ''}${stockmarketNote ? `${stockmarketNote}\n` : ''}Your ONLY job is to call every mandatory tool with an appropriate input.
Do not answer the user, do not explain, and do not produce JSON in this step.
Derive the search query or target URL for each tool from the latest user message and the conversation context.
${STANDALONE_QUERY_RULES}
${queryGuidance}
Emit ALL mandatory tool calls in ONE response, as parallel tool calls. Do not stop after the first tool call.
You may call the same tool more than once with differently phrased queries when the task needs broader coverage.
When you call the SAME search tool multiple times and an explicit imageCount/videoCount is set, split that total evenly across the calls so their sum equals the target — never pass the full count to each call. Example: total 10 across 3 queries → pass count 4, 3, 3. When no explicit count is set, make every call WITHOUT a count parameter and let each tool use its default.
Each mandatory tool must be called at least once. Missing a mandatory tool is a failure.
${countInstruction}
Example tool call format: { "toolName": "serperWebSearch", "input": { "query": "..." } }
Return ONLY tool calls. No prose.
FINAL REMINDER:
- Call every mandatory tool at least once and return ONLY tool calls; no prose, no explanations, no JSON deliverables.
- Every query names its subject explicitly; never pass the user message verbatim as a query.`;
}
