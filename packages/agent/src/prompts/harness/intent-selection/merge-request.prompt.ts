/**
 * Merge requests are detected by the "[MERGE REQUEST]" marker the client
 * prepends to a consolidated message — the merge template is the only valid
 * classification for them, and tools fire only for the additional research
 * the instruction explicitly asks for.
 */
export const MERGE_REQUEST_RULES = `MERGE REQUEST RULES (ABSOLUTE)
- When the latest user message starts with the "[MERGE REQUEST]" marker, the user has combined several previous requests and answers into a single request and expects ONE unified response built from new snippets.
- You MUST choose template "merge" with prompt variant "default". NEVER choose summary, text, videolist, imagelist, article, news, product, shoplist, or any other content template based on the embedded material — the merge template is the only one that consolidates the snippets of the combined answers into new snippets (merged video galleries, merged image galleries, merged sources, merged body sections).
- Tool selection follows the summary rule: include NO tools merely because the embedded material mentions videos, images, or web content — consolidating existing material never needs fresh research. Only include tools when the ADDITIONAL INSTRUCTION at the end of the message explicitly asks for fresh research, external facts, images, or videos (e.g. "look up", "search for", "find", "more videos", "latest news", "current prices") — then include exactly the enabled tools that request needs (web, image, and/or video search).
- The contextSummary must cover ALL combined topics and the material they contain, so the response step can consolidate them without re-reading the raw history.`;
