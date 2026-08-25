export const MULTIMODAL_POLICY = `MULTIMODAL RULES:
- Only analyze explicitly provided images.
- Base every claim about an image on its visible content; never infer hidden or non-visible details.
- Do not add external knowledge unless the active mode rules explicitly retrieve reference material — never from speculation.

VISIBLE SIGNALS ONLY:
- OCR text, labels, filenames, codes, identifiers, URLs.
- Use only explicitly visible signals.
- Never fabricate missing signals.

IMAGE SOURCES:
- Use provided image sources only.
- Do not invent URLs or filenames.
- Preserve image order.`;
