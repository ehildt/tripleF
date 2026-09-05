/**
 * Follow-up resolution against the conversation history: keep the template
 * of the prior response unless the task type genuinely changes, and never
 * pick an image-required template without fresh attachments (the guardrail
 * below owns the fallback mapping).
 */
export const FOLLOW_UP_RULES = `FOLLOW-UP / REFINEMENT RULES
- These rules apply when the latest message CONTINUES an earlier topic. For NEW TOPIC requests, classify the latest message on its own.
- Assistant turns in the history carry a '[Template: <name>]' marker naming the template that produced each prior answer — use it to resolve what "the prior response" was.
- Resolve follow-ups against the full conversation history, not just the latest message.
- The latest message may be short ("show me images", "add videos", "what about news?", "summarize", "evaluate")
  because it references prior context. Always look BACK at prior turns to understand intent.
- A follow-up that builds on a previous topic should keep the SAME template as the prior response
  unless the user explicitly changes the task type.
- If the user asks for media (images, news, videos) about a previously established topic:
  → When the user wants the media WITH the established context (e.g. "show me images", "add videos too"), keep the template from the prior context (usually "article") and add the corresponding tool (imageSearch, newsSearch, videoSearch).
  → When the user wants ONLY the media (e.g. "just the images", "only show me the videos", "give me a playlist instead"), switch to "imagelist" or "videolist".
  → Do NOT switch to "describe" unless the user uploaded images.
- If the user asks for a summary or recap of the prior conversation without new images:
  → Choose template "summary".
  → If the user also asks for external facts, online research, images, or videos, include the enabled *WebSearch tool and every enabled *ImageSearch and *VideoSearch tool.
  → Otherwise, do NOT invoke a *WebSearch or other tools unless external facts are explicitly requested.
- If the user asks for an evaluation, critique, review, pros/cons, or judgment about items from the prior conversation:
  → Choose template "evaluation".
  → Always include every enabled *ImageSearch and *VideoSearch tool.
  → Also include the enabled *WebSearch tool when the user asks for external facts or online research.
- Examples:
  Prior: article about "Gothic remake". User: "now show me images" → article, tools: [serperWebSearch, serperImageSearch]
  Prior: article about "Gothic remake". User: "add videos too" → article, tools: [serperWebSearch, serperImageSearch, serperVideoSearch]
  Prior: article about "Gothic remake". User: "what about news coverage" → article, tools: [serperWebSearch, serperNewsSearch]
  Prior: article about "Gothic remake". User: "give me the latest news" → news, tools: [serperWebSearch, serperNewsSearch, serperImageSearch, serperVideoSearch]
  Prior: article about "Gothic remake". User: "uploaded photos, describe them" → describe (has images).
  Prior: article about "Gothic remake". User: "summarize what we discussed" → summary, no tools.
  Prior: article about "Gothic remake". User: "evaluate this game" → evaluation, tools: [serperImageSearch, serperVideoSearch].
  Prior: product overview for "Sony WH-1000XM5" ([Template: product]). User: "where else can I buy it?" → shoplist, tools: [serperWebSearch, serperShoppingSearch, serperImageSearch].
  Prior: product overview for "Samsung 990 Pro 2TB" ([Template: product]). User: "gibt es das auch woanders günstiger?" (German — is it cheaper anywhere else?) → shoplist, tools: [serperWebSearch, serperShoppingSearch, serperImageSearch].
  Prior: product overview for "Sony WH-1000XM5" ([Template: product]). User: "is it still worth it?" → evaluation, tools: [serperImageSearch, serperVideoSearch].
- If the user provides corrections (e.g. "I wanted images"), add the missing tools to the existing set.
- Do NOT downgrade template to text just because the user is clarifying.
- If the latest message alone seems vague ("show me"), check prior turns for context.
- If the user asks to compare or describe previously established topics and NO images are attached in the current request:
  → NEVER pick "compare", "describe", or "ocr" without images — apply the IMAGE-REQUIRED TEMPLATE GUARDRAIL fallbacks (summary for a recap, evaluation for a verdict, text for a plain answer).`;

export const TOPIC_BASED_TOOL_RULES = `TOPIC-BASED TOOL SELECTION
When template is article, news, or text and the user query involves:
  - upcoming releases, new products, game development: include the enabled *WebSearch tool
  - factual research, data, statistics: include the enabled *WebSearch tool
  - specific named entities (games, movies, books, people): include the enabled *WebSearch tool
  - current events, news, announcements: include the enabled *WebSearch tool + newsSearch
  - personal opinion, creative writing, brainstorming: exclude *WebSearch tools
  - coding help: exclude the *WebSearch tool unless user asks about a specific library/framework version`;

export const CLARIFICATION_RULES = `CLARIFICATION RULES
If the user request is ambiguous, incomplete, or could refer to multiple
distinct topics, set needsClarification=true and write a concise clarifying
question instead of picking a template or tools.`;

export const CLARIFICATION_QUESTION_STYLE = `CLARIFICATION QUESTION STYLE
- Ask what the user might have meant — never a bare "What do you mean?".
- Offer the 2-4 most likely interpretations as concrete options, e.g. "Did you mean the video game Gothic, the architectural style, or the literary genre?".
- If a term looks like a typo or an unclear reference, state your best guess and ask to confirm, e.g. "Did you mean 'Nioh 3'?".
- Keep the question short, natural, and answerable in a few words.
- Write the question in the language of the latest user message.`;

export const CLARIFICATION_EXAMPLES = `Examples where clarification is needed:
  - "Tell me about Ace" → ask which Ace: the person, the game, or the brand
  - "Gothic remake" → ask: "Did you mean the Gothic video game remake, the film, or something else?"
  - "How do I install it" → ask what "it" refers to, naming the most likely candidates from context
  - "Compare the two" → ask which two items, naming the most likely candidates from context

When needsClarification=true:
  - Set template to "text" (placeholder)
  - Set prompt to "default"
  - Set tools to [] (empty)
  - Set plan to {} (empty)
  - Write a SPECIFIC question that resolves the issue
  - For disambiguation, keep it answerable in 1-2 words when possible
  - For prior-image references without a current attachment, the question may be a full sentence and should ask the user to re-attach the image(s)`;
