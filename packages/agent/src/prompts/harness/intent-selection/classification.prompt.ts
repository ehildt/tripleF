import { TEMPLATE_VARIANTS } from '../variant-instructions.registry.js';

/**
 * The flat template checklist — derived from TEMPLATE_VARIANTS keys so the
 * catalog can never drift from the templates that actually exist (the
 * stockmarket pair once went missing here).
 */
export function buildAvailableTemplates(): string {
  return `AVAILABLE TEMPLATES
${Object.keys(TEMPLATE_VARIANTS)
  .map((template) => `- ${template}`)
  .join('\n')}`;
}

export const CLASSIFICATION_RULES = `CLASSIFICATION RULES
- choose exactly one template
- choose exactly one prompt variant per template
- choose only required tools
- choose only image variants that would materially improve analysis
- never invent tools or variants
- never hallucinate capabilities
- if uncertain prefer text + default`;

/**
 * One line of purpose per template plus the tool behavior that template
 * always carries. Detailed selection rules live in the dedicated per-template
 * sections above — the product/shoplist/news entries point there instead of
 * repeating them. describe/compare/ocr are image-required (MULTIMODAL RULES).
 */
export const TEMPLATE_RULES = `TEMPLATE RULES
- article: for in-depth research, detailed reports, analysis, and background on products, entities, or topics — the extensive long-form complement to the compact news brief.
  A *WebSearch tool SHOULD be included in nearly all cases.
  Only omit the *WebSearch tool if the user has provided ALL necessary data as attached media.
  If the topic involves external entities or current information, a *WebSearch tool is REQUIRED.
  The article template ALWAYS includes every enabled *ImageSearch and *VideoSearch tool, even when the user does not explicitly ask for images or videos.
  If the user asks for images, video, or background context, include the corresponding search tools. Use the "news" template for current-events updates, announcements, and status reports, not "article".
- news: for current events, announcements, product launches, status updates, breaking news, or recent developments — the compact brief: headline, lead, key points, minimal context. Selection details per the NEWS TEMPLATE RULES above.
  The news template ALWAYS includes every enabled *ImageSearch and *VideoSearch tool, even when the user does not explicitly ask for images or videos.
  Also include *ImageSearch and *VideoSearch tools when the user asks for media or when the topic is likely to have visuals.
- describe: for describing user-provided images. No tools unless the user explicitly asks for external data or the images contain searchable clues (watermarks, URLs, brands, logos, recognizable named entities). When tools are included, select EVERY enabled *WebSearch, EVERY enabled *ImageSearch, and EVERY enabled *VideoSearch tool of every enabled provider (e.g. Serper AND Bright Data when both are on) — search providers return different result sets, and the respond step selects reference images by textual evidence, so broader coverage costs nothing and improves identification.
- compare: ONLY for comparing images the user uploaded in the CURRENT request — information/entity comparisons are never "compare"; see COMPARE IS FOR UPLOADED IMAGES ONLY. No tools unless the user explicitly asks for external data or the images contain searchable clues.
  If the user asks whether the uploaded images match/resemble/reference an external topic (e.g. "are these characters from X?", "is this from game Y?", "do these images show Z?"), keep template "compare" with the default (not visual) variant, include EVERY enabled *ImageSearch tool (one per enabled provider) and EVERY enabled *VideoSearch tool for reference discovery, and use the search results as corroborating reference evidence. Do NOT switch to evaluation or summary just because the question mentions an external topic.
- ocr: for extracting text from images. No tools unless the extracted text contains URLs or named entities the user asks you to look up. When looking them up, include EVERY enabled provider's *WebSearch tool and EVERY enabled *VideoSearch tool.
- summary: for recapping prior conversation or a provided topic without new images. No tools unless the user explicitly asks for external facts.
  When the user asks for external facts, online research, images, or videos with a summary, include the enabled *WebSearch tool and every enabled *ImageSearch and *VideoSearch tool (same media behavior as article).
  Only set imageCount or videoCount when the user explicitly requests a specific number; otherwise omit them and the system will use configured defaults.
- evaluation: for critiquing, reviewing, assessing, or weighing pros and cons of something from the conversation.
  The evaluation template ALWAYS includes every enabled *ImageSearch and *VideoSearch tool (same media behavior as article) — every evaluation renders hero and gallery media of its subject.
  Include the enabled *WebSearch tool when the user asks for external facts, online research, or the subject needs grounding beyond the conversation.
  Only set imageCount or videoCount when the user explicitly requests a specific number; otherwise omit them and the system will use configured defaults.
- product: for specific product lookups with purchase intent — prices, shop offers, deals, where to buy. Tool selection per the PRODUCT TEMPLATE RULES above.
- shoplist: for repeated purchase questions about a product already covered by a full product overview — prices again, other shops, availability. Tool selection per the SHOPLIST TEMPLATE RULES above.
- text: catch-all for chat, coding, creative writing. Tools only when external data needed.
  Familiarity questions ("do you know X?", "have you heard of X?") use the "familiarity" variant — see FAMILIARITY QUESTION RULES.`;

export const MEDIA_REQUEST_RULES = `MEDIA REQUEST RULES
- When the user asks for media (images, videos, screenshots, photos, graphics) about a topic, this is NOT a clarification — classify it with the appropriate media tools.
- If the user wants ONLY images or ONLY videos (no accompanying article), choose "imagelist" or "videolist" respectively.
- If the user wants an article or news story that also includes media, choose "article" or "news" — media tools are added automatically.
- A short follow-up asking for media is a valid instruction. It should select the structured template that matches the context and include imageSearch/videoSearch tools.
- Do NOT downgrade to text when the latest message only adds media requests to an established topic.`;
