const COMPARE_REMINDER = `COMPARE-SPECIFIC REMINDER:
- This is a compare response.
- sectionContent MUST state whether you compared only the uploaded images or also used internet reference images, list which cloud images you selected and why, answer the user's question, and mention that reference images are attached in the Files panel.
- galleryItems holds ONLY the cloud reference images you picked as corroborating evidence — never the uploaded user image(s), which are already visible as attachments.
- When cloud reference images are included, set note to one short sentence IN THE USER'S LANGUAGE telling them the reference images are attached in the Files panel and can be replaced.`;

const DESCRIBE_REMINDER = `DESCRIBE-SPECIFIC REMINDER:
- This is a describe response.
- sectionContent MUST state whether you used internet reference images to verify the description, list the visual signal(s) from the uploaded image that triggered the search (watermark, logo, text, etc.), list which cloud images you selected and why, and mention that reference images are attached in the Files panel.
- galleryItems holds ONLY the cloud reference images you picked as corroborating evidence — never the uploaded user image(s), which are already visible as attachments.
- When cloud reference images are included, set note to one short sentence IN THE USER'S LANGUAGE telling them the reference images are attached in the Files panel and can be replaced.`;

const FINAL_ATTEMPT_RULES = `FINAL ATTEMPT RULES (this is the last retry — stop fighting these errors):
- A valid response WITHOUT the broken field is required — never repeat an invalid value that already failed.
- URL fields that cannot be made valid: REMOVE them. Use an empty string for optional URL fields (heroImageUrl, heroVideoUrl); drop the whole entry from galleryItems, videoGalleryItems, sources, relatedStories, cards, or shopOffers. Empty strings and empty arrays are valid.
- Never invent or re-type a URL: emit only URLs that appear verbatim in the tool context. If none fits, omit the media/URL field entirely.
- Any other field that cannot satisfy the schema: omit it when optional; replace it with the smallest valid value (empty string, empty array, 0) when required.
- Adjust the prose so it no longer references removed media or dropped entries.`;

const correctionTemplate = (error: string, template?: string, finalAttempt?: boolean): string => {
  // Conditional sections only — the static body is a literal below.
  const extraSections = [
    template === 'compare' ? COMPARE_REMINDER : '',
    template === 'describe' ? DESCRIBE_REMINDER : '',
    finalAttempt ? FINAL_ATTEMPT_RULES : '',
  ]
    .filter(Boolean)
    .join('\n');

  const body = `Your previous response was not valid.
${error ? `Error: ${error}\n` : ''}Return ONLY a single valid JSON object.
All object keys must be quoted with double quotes.
Do not add markdown code fences, explanations, or extra text.
Ensure every required key is present and has the correct type.
ARRAY RULES (the most common failure):
- keyFindings and keyPoints must be arrays of objects: [{"text":"..."}] — never strings like ["..."].
- sources must be arrays of objects: [{"url":"https://...","title":"..."}] — never strings.
- galleryItems must be arrays of objects: [{"imageUrl":"https://...","imageAlt":"...","title":"...","caption":"..."}].
- videoGalleryItems must be arrays of objects: [{"videoUrl":"https://..."}].
Example of a valid response shape:
{
  "category": "...",
  "title": "...",
  "keyFindings": [{ "text": "..." }],
  "sources": [{ "url": "https://example.com", "title": "Example" }],
  "galleryItems": [{ "imageUrl": "https://example.com/img.jpg", "imageAlt": "...", "title": "...", "caption": "..." }]
}`;

  return `${body}${extraSections ? `\n${extraSections}` : ''}\nFINAL REMINDER:\n- Return ONLY a single valid JSON object. No markdown code fences, no explanations, no extra text.`;
};

/**
 * Returns the full correction prompt template for a given error message.
 * On the final attempt the prompt instructs the model to remove unfixable
 * URLs and fields instead of fixing them, so the response validates.
 */
export function buildCorrectionPrompt(error: string, template?: string, options?: { finalAttempt?: boolean }): string {
  return correctionTemplate(error, template, options?.finalAttempt);
}
