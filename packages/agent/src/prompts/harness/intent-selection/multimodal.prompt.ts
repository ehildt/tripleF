/**
 * The image-processing plan the classifier emits when images are attached:
 * resize by default, preprocessing variants only when they materially help.
 */
export const IMAGE_PLAN_RULES = `IMAGE PROCESSING PLAN
- If images are attached, include plan.images with resize and variants.
- resize: true by default. Set false only if the user explicitly asks for full resolution.
- variants: array of variant names (grayscale, denoised, sharpened, clahe).
- Only include variants that would materially improve the analysis.
- If the original image is sufficient, use an empty variants array.`;

/**
 * describe/compare/ocr are image-required templates. The attachment marker
 * is the proof images exist; prior-turn images are invisible to the pipeline.
 * Fallbacks for image-less requests live in the IMAGE-REQUIRED TEMPLATE
 * GUARDRAIL below — the single canonical mapping.
 */
export const MULTIMODAL_TEMPLATE_RULES = `MULTIMODAL RULES
- describe, compare, and ocr are IMAGE-REQUIRED templates.
- They may ONLY be selected when images are PROVIDED in the CURRENT request.
- For classification purposes, the current user message ALWAYS contains an image marker such as "[1 image attached]" or "[N images attached]" when images are part of the current request.
- Treat that marker as proof that images are attached. Do NOT ask the user to re-attach them.
- If the user refers to an image from a previous turn (e.g. "describe that image I sent", "use the earlier image") but the current message has no image marker,
  do NOT select describe/compare/ocr — the pipeline cannot see earlier images.
  Set needsClarification=true and ask the user to re-attach the image(s).
- If the user asks to describe, compare, or extract text WITHOUT referring to a prior image and no images are attached,
  do NOT select describe/compare/ocr and do NOT ask for clarification — pick the fallback template from the IMAGE-REQUIRED TEMPLATE GUARDRAIL below.
- image + vague request → describe
- image text extraction → ocr
- multiple images comparison → compare
- no images present → never describe, compare, or ocr`;

/**
 * "compare" exists solely for uploaded images. Information comparisons
 * ("X vs Y") are evaluation (verdict wanted), article (neutral report), or
 * text (casual) — never compare.
 */
export const COMPARE_UPLOADED_ONLY_RULES = `COMPARE IS FOR UPLOADED IMAGES ONLY
- The "compare" template exists solely to compare images the user uploaded in the CURRENT request. Nothing else ever maps to it.
- Comparisons of information NEVER use "compare" — not for games, movies, products, companies, people, places, versions, specs, prices, or opinions. This covers "X vs Y", "X versus Y", "X or Y", "how does X compare to Y", "how does X differ from Y", "is X better than Y", "what is the difference between X and Y", "vergleiche X mit Y", "was ist der Unterschied".
- Information comparisons instead use:
  → "evaluation" when a verdict, judgment, critique, or pros/cons are wanted — the default for "how does X compare to Y?".
  → "article" for a neutral side-by-side research report.
  → "text" for casual conversational answers.
- Information comparisons usually need facts about BOTH subjects: include a *WebSearch tool unless the conversation already provides everything.
- Example: User: "how does NTE compare to Wuthering Waves?" → template: "evaluation", tools: [serperWebSearch, serperImageSearch, serperVideoSearch]
- Example: User: "Xbox Ally X vs Steam Deck OLED — which should I buy?" → template: "evaluation", tools: [serperWebSearch, serperImageSearch, serperVideoSearch]
- Counter-example: User attaches two screenshots and asks "which of these is from game X?" → template: "compare" (images are present).`;

/**
 * Image-self-analysis is visual-first: research tools join only for explicit
 * asks or clear searchable clues, and when they join it is every enabled
 * provider — wider candidate pools feed the evidence-selection step.
 */
export const IMAGE_SELF_ANALYSIS_TOOL_RULES = `IMAGE-SELF-ANALYSIS TOOL RULES
- For describe, compare, and ocr, the default is visual-only analysis.
- The model should first look at the image(s) and identify any clues that could be researched online: watermarks, URLs, brand names, logos, social-media handles, recognizable people, products, buildings, or locations.
- Only include *WebSearch, webFetch, imageSearch, or videoSearch tools if the user explicitly asks for external context OR the images contain a clear searchable clue.
- When external research IS included, include EVERY enabled *WebSearch tool, EVERY enabled *ImageSearch tool, and EVERY enabled *VideoSearch tool across all enabled providers, not just one tool per category: the enabled search providers (e.g. Serper and Bright Data) return different result sets, and wider candidate pools feed the evidence-selection step — a longer tool list is correct here, not wasteful.
- If you are unsure whether the user wants external research, default to visual-only analysis without tools; never ask for clarification over a tool choice.
- When external research is used for describe/compare/ocr, the response must disclose it and label any externally derived information as an assumption (e.g. "I noticed a watermark/URL/brand in the image and searched the internet for more context. The following identification is based on that research and may be an assumption.").`;

/**
 * The canonical fallback mapping for image-required templates when no images
 * are attached to the current request.
 */
export const IMAGE_REQUIRED_TEMPLATE_GUARDRAIL = `IMAGE-REQUIRED TEMPLATE GUARDRAIL
- describe, compare, and ocr require images attached to the CURRENT user message.
- If the user asks for one of these templates but no images are attached, do NOT ask for clarification.
- Instead, pick a fallback template:
  → compare without images → summary (recap differences), evaluation (critique), or text (plain answer).
  → describe without images → summary or text.
  → ocr without images → summary or text.
- Only set needsClarification=true when the topic itself is ambiguous — or when the user refers to an image from a previous turn that is not attached now (ask them to re-attach). Never set it just because the user omitted images for a new multimodal request.`;
