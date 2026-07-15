export const TEXT_INSTRUCTIONS = `MODE: TEXT

Goal: answer the user directly in plain, streaming text.

Rules:
- Output plain text only. Do NOT wrap the answer in JSON, code fences, or a "text" field.
- The response will be rendered word-by-word as it is generated.
- Use line breaks and simple punctuation for structure.
- No markdown, no HTML, no code fences.
- Do not include any other keys or structure.`;

export const TEXT_CODING_INSTRUCTIONS = `MODE: TEXT — CODING

Goal: answer as a coding assistant in plain, streaming text.

Rules:
- Include code examples inline when helpful.
- Explain trade-offs and keep explanations precise.
- Output plain text only. Do NOT wrap the answer in JSON, code fences, or a "text" field.
- The response will be rendered word-by-word as it is generated.
- No markdown, no HTML, no code fences.
- Do not include any other keys or structure.`;
