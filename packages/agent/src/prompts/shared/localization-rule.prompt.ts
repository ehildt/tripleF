import { resolveLanguageName } from '../harness/helpers/resolve-language-name.helper.js';

/**
 * Build a localization rule that forces every user-facing output field into
 * the user's language. It is appended late in the content system prompt so
 * it outranks the (English) example labels embedded in the per-template
 * instructions, which are explicitly declared illustrative.
 *
 * It must be careful to keep verbatim the fields that must NOT be translated
 * (URLs, ISO codes, source titles, verbatim media titles, brand names) so a
 * small model does not over-translate.
 */
export function buildLocalizationRule(language?: string): string {
  const code = language?.trim().toLowerCase() ?? '';

  if (!code) {
    return `LOCALIZATION (ABSOLUTE)
- Write EVERY user-facing text field in the language of the user's most recent message.
- The English example labels in the instructions above are illustrative ONLY — translate them into that language.
- Localize wherever they appear: category, title, subtitle, headline, deck, lead, summary, sectionTitle, sectionContent, conclusion, verdict, scoreLabel, aggregateRatingLabel, galleryTitle, videoGalleryTitle, gallery item title & caption, video item title & caption, keyFindings / keyPoints / strengths / weaknesses / recommendations / pros / cons entries, shop offer title & delivery, note, and any "no results found" fallback phrasing.
- In "Label: value" rows (e.g. keyPoints, statHighlights) translate only the label; keep numbers, units, and technical values verbatim.
- Keep verbatim, never translate: URLs, ISO-639 language codes, source titles and sourceName, heroVideoTitle, internationalCoverage "title" (original language — only its "summary" is translated), brand names, product names, proper nouns, and quoted fragments.
- Do not translate internal markers, tool arguments, or your reasoning.`;
  }

  const name = resolveLanguageName(code);

  return `LOCALIZATION (ABSOLUTE)
- The user's language is ${name} (${code}).
- Write EVERY user-facing text field in ${name}.
- The English example labels in the instructions above are illustrative ONLY — translate them into ${name}.
- Localize wherever they appear: category, title, subtitle, headline, deck, lead, summary, sectionTitle, sectionContent, conclusion, verdict, scoreLabel, aggregateRatingLabel, galleryTitle, videoGalleryTitle, gallery item title & caption, video item title & caption, keyFindings / keyPoints / strengths / weaknesses / recommendations / pros / cons entries, shop offer title & delivery, note, and any "no results found" fallback phrasing.
- In "Label: value" rows (e.g. keyPoints, statHighlights) translate only the label; keep numbers, units, and technical values verbatim.
- Keep verbatim, never translate: URLs, ISO-639 language codes, source titles and sourceName, heroVideoTitle, internationalCoverage "title" (original language — only its "summary" is translated), brand names, product names, proper nouns, and quoted fragments.
- Do not translate internal markers, tool arguments, or your reasoning.`;
}
