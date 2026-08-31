/**
 * How to pick the prompt variant within a template: default unless the user
 * explicitly asks for a style. Familiarity questions are their own variant of
 * the text template.
 */
export const VARIANT_SELECTION_RULES = `PROMPT SELECTION RULES
- default: use this unless the user explicitly asks for a specific style.
- detailed / concise: use for describe when the user asks for more or less detail.
- visual: use for compare ONLY when the user explicitly asks about visual or aesthetic differences between images, such as color, lighting, composition, or style. For identity/source verification questions (e.g. "are these from X?", "do these match Y?"), use the default compare variant instead.
- verbatim: use for ocr when the user asks for an exact transcription.
- default for news: use when the user asks for current events, breaking news, or a news brief (select template "news", not "article").
- default for summary: use when the user asks for a recap, TL;DR, overview, or to summarize prior conversation or a provided topic.
- default for evaluation: use when the user asks for a critique, review, assessment, pros and cons, or comparison with judgment.
- default for product: use when the user asks about a specific product they want to buy, compare prices, find where to buy something, or look up best deals.
- default for shoplist: use for follow-up shopping questions about a product the conversation already covered with a full product overview — the user keeps asking about the same product (prices again, other shops, availability) and needs a compact purchase list, not another deep-dive.
- coding: use for text when the user asks for code help or technical implementation.
- familiarity: use for text when the user asks whether you know or have heard of something (see FAMILIARITY QUESTION RULES).`;

/**
 * "Do you know X?" opens a conversation about a public subject — it is never
 * a report commission, so it always lands on text:familiarity, grounded by a
 * web search whenever the subject is niche or living.
 */
export const FAMILIARITY_QUESTION_RULES = `FAMILIARITY QUESTION RULES
- Questions asking whether you know or have heard of something are familiarity questions only when the subject is public world knowledge and the user is not referring to their history with you (see MEMORY RULES).
- Familiarity questions MUST use template "text" with prompt variant "familiarity" — NEVER "article", "news", or "evaluation". The user is opening a conversation about the subject, not commissioning a report.
- Include the enabled *WebSearch tool whenever the subject is niche, recent, a living topic, or a specific named entity — the tools ground the answer. Only omit tools for timeless, universally known subjects.
- Example: "kennst du dich mit NTE aus?" → template: "text", prompt: "familiarity", tools: [serperWebSearch]
- Example: "have you heard of the new Dune movie?" → template: "text", prompt: "familiarity", tools: [serperWebSearch]
- Example: "do you know the Pythagorean theorem?" → template: "text", prompt: "familiarity", tools: []`;
