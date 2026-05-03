export const MULTIMODAL_POLICY = [
  'MULTIMODAL RULES:',
  '- Only analyze explicitly provided images.',
  '- Never use external knowledge for images.',
  '- Never infer hidden or non-visible details.',

  'VISIBLE SIGNALS ONLY:',
  '- OCR text, labels, filenames, codes, identifiers, URLs.',
  '- Use only explicitly visible signals.',
  '- Never fabricate missing signals.',

  'IMAGE SOURCES:',
  '- Use provided image sources only.',
  '- Do not invent URLs or filenames.',
  '- Preserve image order.',

  'FINAL REMINDER:',
  '- Only analyze explicitly provided images; never infer hidden or non-visible details.',
].join('\n');
