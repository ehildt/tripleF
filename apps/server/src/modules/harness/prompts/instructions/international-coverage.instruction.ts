/**
 * Spec for the `internationalCoverage` aside, appended to every template's
 * instructions. The aside surfaces noteworthy results found in languages
 * other than the user's — nothing is ever sacrificed, it just lives aside.
 * The pools it draws from exist only when language-diverse tool results
 * arrived; absent pools mean the field is omitted.
 */
export const INTERNATIONAL_COVERAGE_INSTRUCTIONS = `INTERNATIONAL COVERAGE ASIDE:
- internationalCoverage: an array of 0–3 entries highlighting the most noteworthy results found in languages other than the user's. Fill it ONLY from the internationalArticles and internationalVideos pools in the tool context; omit the field entirely when those pools are absent or empty.
- Each entry is an object with exactly these keys: "title", "url", "sourceName", "language", "summary".
- title: the item's original-language title, copied verbatim — never translated.
- url: the item's URL, copied verbatim from its context entry.
- sourceName: the publishing source or channel name from its context entry.
- language: the item's two-letter ISO language code copied from its context entry (e.g. "zh", "ru", "en").
- summary: one or two sentences in the USER'S language stating what this source reports and why it matters.
- internationalCoverage entries must never reuse a URL that appears in any primary field (sources, hero media, galleries, sectionContent, relatedStories, cards).`;
