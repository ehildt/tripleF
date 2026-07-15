import type {
  HarnessResponseData,
  RelatedStory,
  ShopOffer,
  Source,
} from '@/types/harness-response-data.model';

function appendList(
  parts: string[],
  title: string,
  items?: Array<{ text?: string }>,
): void {
  if (!items?.length) return;
  parts.push(title);
  for (const item of items) {
    const text = item.text?.trim();
    if (text) parts.push(`- ${text}`);
  }
}

function buildScoreLine(score: number, scoreLabel?: string): string {
  const label = scoreLabel ? ` (${scoreLabel})` : '';
  return `Score: ${score}${label}`;
}

function buildSourceLine(source: Source | RelatedStory): string {
  const label = [source.title, source.sourceName].filter(Boolean).join(' — ');
  const urlPart = source.url ? ` (${source.url})` : '';
  return `- ${label}${urlPart}`;
}

function buildShopOfferLine(offer: ShopOffer): string | undefined {
  const label = [offer.title, offer.price, offer.source]
    .filter(Boolean)
    .join(' — ');
  if (!label) return undefined;
  const rating =
    typeof offer.rating === 'number' ? ` — rating ${offer.rating}` : '';
  const linkPart = offer.link ? ` (${offer.link})` : '';
  return `- ${label}${rating}${linkPart}`;
}

function appendSources(parts: string[], data: HarnessResponseData): void {
  const sources = data.sources;
  if (!sources?.length) return;
  parts.push('Sources:');
  for (const source of sources) {
    parts.push(buildSourceLine(source));
  }
}

function appendRelatedStories(
  parts: string[],
  data: HarnessResponseData,
): void {
  const stories = data.relatedStories;
  if (!stories?.length) return;
  parts.push('Related stories:');
  for (const story of stories) {
    parts.push(buildSourceLine(story));
  }
}

function appendArticleCards(parts: string[], data: HarnessResponseData): void {
  const cards = data.cards;
  if (!cards?.length) return;
  parts.push('Article cards:');
  for (const card of cards) {
    const label = card.title?.trim() || card.linkLabel?.trim() || 'card';
    const urlPart = card.url ? ` (${card.url})` : '';
    parts.push(`- ${label}${urlPart}`);
  }
}

function appendShopOffers(parts: string[], data: HarnessResponseData): void {
  const offers = data.shopOffers;
  if (!offers?.length) return;
  parts.push('Shop offers:');
  for (const offer of offers) {
    const line = buildShopOfferLine(offer);
    if (line) parts.push(line);
  }
}

/**
 * Media URLs from earlier responses are listed explicitly so follow-up
 * requests (and the server pipeline) can reference or skip media the user
 * already saw.
 */
function appendPreviouslyShownVideos(
  parts: string[],
  data: HarnessResponseData,
): void {
  const items = data.videoGalleryItems;
  if (!items?.length) return;
  parts.push('Previously shown videos (skip these videoUrls):');
  for (const item of items) {
    if (!item.videoUrl) continue;
    const label = item.title?.trim() || 'video';
    parts.push(`- ${label} (${item.videoUrl})`);
  }
}

function appendPreviouslyShownImages(
  parts: string[],
  data: HarnessResponseData,
): void {
  const items = data.galleryItems;
  if (!items?.length) return;
  parts.push('Previously shown images:');
  for (const item of items) {
    if (!item.imageUrl) continue;
    const label = item.title?.trim() || item.imageAlt?.trim() || 'image';
    parts.push(`- ${label} (${item.imageUrl})`);
  }
}

function appendHeroMedia(parts: string[], data: HarnessResponseData): void {
  if (data.heroVideoUrl?.trim())
    parts.push(`Hero video: ${data.heroVideoUrl.trim()}`);
  if (data.heroImageUrl?.trim())
    parts.push(`Hero image: ${data.heroImageUrl.trim()}`);
}

function appendHeaderFields(parts: string[], data: HarnessResponseData): void {
  const fields: Array<[string, string | undefined]> = [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
    ['Headline', data.headline],
    ['Deck', data.deck],
    ['Lead', data.lead],
    ['Subject', data.subject],
    ['Verdict', data.verdict],
    ['Dateline', data.dateline],
    ['Byline', data.byline],
    ['Author', data.author],
    ['Published', data.publishDate],
    ['Read time', data.readTime],
  ];

  for (const [label, value] of fields) {
    const trimmed = value?.trim();
    if (trimmed) parts.push(`${label}: ${trimmed}`);
  }

  if (data.score !== undefined)
    parts.push(buildScoreLine(data.score, data.scoreLabel));
}

function appendBodyFields(parts: string[], data: HarnessResponseData): void {
  if (data.shortDescription?.trim()) parts.push(data.shortDescription.trim());
  if (data.summary?.trim()) parts.push(data.summary.trim());
  if (data.sectionTitle?.trim())
    parts.push(`Section: ${data.sectionTitle.trim()}`);
  if (data.sectionContent?.trim()) parts.push(data.sectionContent.trim());
  if (data.reasoning?.trim()) parts.push(`Reasoning: ${data.reasoning.trim()}`);
}

function appendProductDetails(
  parts: string[],
  data: HarnessResponseData,
): void {
  if (data.priceRange?.trim())
    parts.push(`Price range: ${data.priceRange.trim()}`);
  if (data.aggregateRating !== undefined) {
    const count = data.aggregateRatingCount
      ? ` (${data.aggregateRatingCount} reviews)`
      : '';
    const label = data.aggregateRatingLabel?.trim()
      ? ` — ${data.aggregateRatingLabel.trim()}`
      : '';
    parts.push(`Aggregate rating: ${data.aggregateRating}${count}${label}`);
  }
  if (data.buyAdvice?.trim())
    parts.push(`Buy advice: ${data.buyAdvice.trim()}`);
  if (data.statHighlights?.length) {
    parts.push(
      `Stat highlights: ${data.statHighlights
        .map((stat) => `${stat.label}: ${stat.value}`)
        .join(', ')}`,
    );
  }
  appendShopOffers(parts, data);
  appendList(parts, 'Review summary:', data.reviewSummary);
}

function appendListFields(parts: string[], data: HarnessResponseData): void {
  appendList(parts, 'Key findings:', data.keyFindings);
  appendList(parts, 'Key points:', data.keyPoints);
  appendList(parts, 'Strengths:', data.strengths);
  appendList(parts, 'Weaknesses:', data.weaknesses);
  appendList(parts, 'Recommendations:', data.recommendations);
  appendList(parts, 'Pros:', data.pros);
  appendList(parts, 'Cons:', data.cons);
  appendProductDetails(parts, data);
  appendSources(parts, data);
  appendRelatedStories(parts, data);
  appendArticleCards(parts, data);
  appendPreviouslyShownVideos(parts, data);
  appendPreviouslyShownImages(parts, data);
  appendHeroMedia(parts, data);
}

/**
 * Convert a structured assistant response into a plain-text representation
 * that can be fed back into the LLM as conversation history.
 *
 * Empty or missing fields are skipped so the result stays compact.
 */
export function harnessDataToPromptText(data: HarnessResponseData): string {
  const parts: string[] = [];

  appendHeaderFields(parts, data);
  appendBodyFields(parts, data);
  appendListFields(parts, data);

  if (data.quote?.trim()) parts.push(`Quote: ${data.quote.trim()}`);
  if (data.note?.trim()) parts.push(`Note: ${data.note.trim()}`);
  if (data.conclusion?.trim())
    parts.push(`Conclusion: ${data.conclusion.trim()}`);

  return parts.join('\n\n');
}
