const FINAL_ATTEMPT_RULES = [
  '',
  'FINAL ATTEMPT RULES (this is the last retry — stop fighting these errors):',
  '- A valid response WITHOUT the broken field is required — never repeat an invalid value that already failed.',
  '- URL fields that cannot be made valid: REMOVE them. Use an empty string for optional URL fields (heroImageUrl, heroVideoUrl); drop the whole entry from galleryItems, videoGalleryItems, sources, relatedStories, cards, or shopOffers. Empty strings and empty arrays are valid.',
  '- Never invent or re-type a URL: emit only URLs that appear verbatim in the tool context. If none fits, omit the media/URL field entirely.',
  '- Any other field that cannot satisfy the schema: omit it when optional; replace it with the smallest valid value (empty string, empty array, 0) when required.',
  '- Adjust the prose so it no longer references removed media or dropped entries.',
];

const correctionTemplate = (
  error: string,
  template?: string,
  finalAttempt?: boolean,
) => {
  const compareReminder =
    template === 'compare'
      ? [
          '',
          'COMPARE-SPECIFIC REMINDER:',
          '- This is a compare response with cloud reference images.',
          "- sectionContent MUST state that you compared the uploaded images against internet sources, list which cloud images you selected and why, answer the user's question, and mention that downloaded images are attached in the Files panel.",
          '- Include BOTH uploaded images and any used cloud images in galleryItems.',
          '- Set note to: "Reference images downloaded from the internet are attached in the Files panel. If they do not match what you expected, select the correct image(s) from Files and resend the request."',
        ]
      : [];

  const describeReminder =
    template === 'describe'
      ? [
          '',
          'DESCRIBE-SPECIFIC REMINDER:',
          '- This is a describe response with cloud reference images.',
          '- sectionContent MUST state that you used internet reference images to verify the description, list the visual signal(s) from the uploaded image that triggered the search (watermark, logo, text, etc.), list which cloud images you selected and why, and mention that downloaded images are attached in the Files panel.',
          '- Include the uploaded image and any used cloud images in galleryItems.',
          '- Set note to: "Reference images downloaded from the internet are attached in the Files panel. If they do not match what you expected, select the correct image(s) from Files and resend the request."',
        ]
      : [];

  return [
    'Your previous response was not valid.',
    error ? `Error: ${error}` : undefined,
    '',
    'Return ONLY a single valid JSON object.',
    'All object keys must be quoted with double quotes.',
    'Do not add markdown code fences, explanations, or extra text.',
    'Ensure every required key is present and has the correct type.',
    '',
    'ARRAY RULES (the most common failure):',
    '- keyFindings and keyPoints must be arrays of objects: [{"text":"..."}] — never strings like ["..."].',
    '- sources must be arrays of objects: [{"url":"https://...","title":"..."}] — never strings.',
    '- galleryItems must be arrays of objects: [{"imageUrl":"https://...","imageAlt":"...","title":"...","caption":"..."}].',
    '- videoGalleryItems must be arrays of objects: [{"videoUrl":"https://..."}].',
    '',
    'Example of a valid response shape:',
    '{',
    '  "category": "...",',
    '  "title": "...",',
    '  "keyFindings": [{ "text": "..." }],',
    '  "sources": [{ "url": "https://example.com", "title": "Example" }],',
    '  "galleryItems": [{ "imageUrl": "https://example.com/img.jpg", "imageAlt": "...", "title": "...", "caption": "..." }]',
    '}',
    ...compareReminder,
    ...describeReminder,
    ...(finalAttempt ? FINAL_ATTEMPT_RULES : []),
    '',
    'FINAL REMINDER:',
    '- Return ONLY a single valid JSON object. No markdown code fences, no explanations, no extra text.',
  ]
    .filter(Boolean)
    .join('\n');
};

/**
 * Returns the full correction prompt template for a given error message.
 * On the final attempt the prompt instructs the model to remove unfixable
 * URLs and fields instead of fixing them, so the response validates.
 */
export function buildCorrectionPrompt(
  error: string,
  template?: string,
  options?: { finalAttempt?: boolean },
): string {
  return correctionTemplate(error, template, options?.finalAttempt);
}
