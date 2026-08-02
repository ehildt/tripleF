---
"@triplef.io/server": minor
---

- Intent-classification engine rewritten: template + prompt-variant selection, primary intent, tool selection as multi-set composition, language detection (ISO-639-1), context summaries for follow-ups, and clarification questions in the user's language
- Templates: article, news, describe, compare, ocr, summary, evaluation, product, shoplist, imagelist, videolist, text(+coding/familiarity) — each with a strict Zod output schema the dashboard renders as structured UI
- Structured-output validators with correction-prompt retries; non-structured templates stream directly
- Media rules shared across templates: hero media, galleries, video galleries, sources; hero video requires a title (schema-refined) so popout/playlist/marquee surfaces are always named
- Imagelist requires an explicit image-only request — informational requests (recipes, how-tos, guides) classify as article/text with image tools instead
- Evaluation template always gathers image/video media for its subject (hero + galleries), matching article behavior
