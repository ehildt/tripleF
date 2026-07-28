/** Static prompt strings for intent classification. */

/**
 * Structured JSON schema and rules that instruct the model how to produce
 * valid intent classification output. Moved out of the action class to keep
 * it under 350 lines.
 */
export function buildStructuredJsonPrompt(): string {
  return [
    'OUTPUT FORMAT — you must output ONLY valid JSON matching this exact schema:',
    '{',
    '  "template": "article|news|describe|compare|ocr|summary|evaluation|product|imagelist|videolist|text|compact",',
    '  "prompt": "promptVariant",',
    '  "reasoning": "string (concise, 30 words or fewer)",',
    '  "tools": ["toolName"],',
    '  "imageCount": number,',
    '  "videoCount": number,',
    '  "getDate": boolean,',
    '  "language": "ISO-639 alpha-2 code detected from the user message",',
    '  "contextSummary": "string (query-focused extraction of prior conversation context the latest user message depends on; verbatim previously shown media URLs for media-list follow-ups; empty if none)",',
    '  "needsClarification": boolean,',
    '  "clarificationQuestion": "string (only when needsClarification=true)",',
    '  "plan": {',
    '    "images": {',
    '      "resize": boolean,',
    '      "variants": ["grayscale"|"denoised"|"sharpened"|"clahe"]',
    '    }',
    '  }',
    '}',
    '',
    'RULES:',
    '- No markdown code fences.',
    '- No explanations, preamble, or postscript.',
    '- Never output undefined. Omit optional fields or use null instead.',
    '- Prompt must be one of the valid variants for the selected template.',
    '- Tools array must contain only exact tool names from the enabled list.',
    '- Do NOT use category names (imageSearch, newsSearch, videoSearch, webpageFetch) as tool names.',
    '- contextSummary: MUST be in the language identified by the "language" field.',
    '- clarificationQuestion: MUST be in the language identified by the "language" field.',
    '- reasoning: MUST be in the language identified by the "language" field.',
    '- If the request is ambiguous set needsClarification=true and provide a concise question in the language identified by the "language" field. The question must offer the most likely interpretations as options.',
    '- imageCount: only include when the user explicitly requests a specific number of images. If omitted, the system defaults to 6.',
    '- videoCount: only include when the user explicitly requests a specific number of videos. If omitted, the system defaults to 6.',
    '- plan.images.resize should be true when images are present, unless the user explicitly asks for full resolution.',
    '- plan.images.variants should only include variants that would materially improve the analysis. Leave empty if the original is sufficient.',
    '- language: detect from the latest user message. Judge by the DOMINANT language of the full sentence or paragraph — individual foreign words, loanwords, scientific or medical terms, brand or proper names, and quoted fragments must NOT change the detected language. Never default to English. If genuinely undetectable, omit the field. ALL human-readable text must be in that language.',
    '',
    'FINAL REMINDER:',
    '- Output ONLY valid JSON matching the exact schema above. No markdown code fences, no explanations, preamble, or postscript.',
  ].join('\n');
}

/**
 * Language correction prompt for when the model's intent classification is missing
 * a valid language field.
 */
export const languageCorrectionPrompt = [
  'Your previous response was not valid.',
  'Error: the "language" field is required and must be an ISO-639 alpha-2 code.',
  '',
  'Return ONLY a single valid JSON object.',
  'All object keys must be quoted with double quotes.',
  'Do not add markdown code fences, explanations, or extra text.',
  'Ensure the "language" field is present and has the correct value.',
  '',
  '- language: detect from the latest user message. Judge by the DOMINANT language of the full sentence or paragraph — individual foreign words, loanwords, scientific or medical terms, brand or proper names, and quoted fragments must NOT change the detected language. Pick the most likely ISO-639 alpha-2 code; never default to English.',
  '- All human-readable text (reasoning, contextSummary, clarificationQuestion) MUST be in the language identified by the "language" field.',
  '- Never use English unless the user wrote in English.',
  '',
  'FINAL REMINDER:',
  '- Return ONLY a single valid JSON object with all required keys, including "language". No markdown code fences, no explanations, no extra text.',
].join('\n');
