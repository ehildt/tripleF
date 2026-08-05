# 4. Business Logic: How the Features Work

This section explains, in plain language, what tripleF actually does and what each capability relies on. It focuses on the *why* and the *dependencies* — the business rules that sit behind the mechanics described in sections 1 and 2. It is written for architects and developers who want to understand the system's intent, not for someone reading the source line by line.

## 4.1 The product in one paragraph

tripleF is a local-first, agentic AI workbench: a conversation harness (server) plus a dashboard (web UI). A user asks a question, optionally attaching images. The harness decides what kind of answer is needed, gathers real-world evidence from web and media searches, composes a structured answer, and streams it live to the UI, where it is rendered as rich, interactive content — articles, product overviews, news briefings, comparisons, and video or image collections. Because it runs on free models through Ollama (locally or in the cloud), every capability is built on one shared assumption: a single model call is not enough. Answers are built in stages and verified against real data before the user sees them.

## 4.2 The core loop: request → intent → evidence → answer

Every conversation follows the same loop, which is what gives tripleF its "workbench" character rather than making it a plain chat:

1. **The user asks.** The prompt arrives together with any attached images and metadata about the session.
2. **The intent is classified.** Before anything else, the system decides what kind of task this is — an open chat, a structured report, a comparison, a product lookup, a media collection, and so on. This choice determines the shape of the answer.
3. **Evidence is gathered.** For research-style intents, the system runs searches against external sources (web, image, video, news, shopping) and pulls content from pages. Everything the model is allowed to use must come from these results; the model is not free to invent facts or URLs.
4. **A structured answer is composed.** The model writes its answer against a strict shape for the chosen intent. That shape is the contract between the model and the UI.
5. **The answer is rendered and streamed.** The dashboard paints the structured answer as rich content while it is still being produced, so the user sees progress in real time.
6. **The answer is remembered.** The conversation is persisted and can be compacted when it grows too long, so context is never silently lost.

**What this relies on:** the real-time transport that streams results to the UI; the queue that decouples the slow model from the fast request; the intent classifier and its catalogue of answer shapes; and the search and grounding tools that supply evidence. The loop degrades gracefully — an open chat needs no search, and an offline setup still works for plain conversation.

## 4.3 Media as first-class content

A defining trait of tripleF is that images and videos are treated as structured content, not decoration. Media surfaces (galleries, hero media, playlists) are rendered from the same data contract as text, which is what makes them interactive.

### Videos and the playlist

This is the capability with the most explicit business rules, because a video answer is only useful if it is real, embeddable, and watchable.

**How it works.** When a user asks for videos, the system searches video sources and returns real, verifiable results. The model curates these into a playlist — a titled, ordered collection. The dashboard renders each video as a card; the user can play any video, add it to a persistent playlist, save that playlist, and let it autoplay.

**The title and caption rule.** Every video in the collection must carry both a real title and a short caption. Neither is optional, because both drive the visible surfaces — the card header, the playlist row, the popup title bar, and the "now playing" ticker. A video without a title would appear as an empty, nameless row. Equally important, the caption is **not** a substitute for the title: if a video has no genuine title, the system does not dress up its caption as a title. A nameless video stays nameless (and the caption is shown on its own, only when it exists) rather than being mislabelled.

**What it relies on:**
- the video search tools that supply real URLs and metadata (duration, channel, date, views, thumbnail);
- the strict answer shape that rejects videos with missing titles or captions, so the contract is enforced before the UI ever sees the data;
- an allow-list of embeddable providers (for example YouTube and Vimeo) — a video is only offered if it can actually be embedded and played, so the user never gets a dead "watch elsewhere" card;
- the deduplication rule that stops already-seen videos from being shown again across the conversation history;
- the dashboard's persistent playlist, stored in the browser, so the queue survives switching tabs or conversations;
- a single shared player that floats over the page, so only one thing plays at a time and playback is not interrupted by scrolling or navigation.

### Images

Images follow the same philosophy. They are gathered from image search, filtered by quality and trust, deduplicated against what the user has already uploaded or seen, and rendered as galleries. A hero image leads a story; the rest fill a gallery. Images are verified to actually exist before being shown, and are stored locally rather than hot-linking to flaky external URLs.

**What it relies on:** image search results, the media ingestion and preprocessing pipeline, and local object storage for the actual image files.

## 4.4 Structured answers: one model, many shapes

Instead of free-form prose, tripleF renders most answers from structured data. A product answer has ratings, pros and cons, shop offers, and a media area. A news briefing has a headline, key points, sources, and international coverage. A comparison lays out alternatives side by side. The UI knows exactly how to paint each shape.

**Why this matters.** It turns model output into something the user can act on — click a source, play a video, save a product — rather than just read. It also makes follow-up turns precise: the history handed back to the model preserves the facts (titles, URLs, shown media) instead of losing them in prose.

**What it relies on:** the catalogue of answer shapes, the intent classifier that selects the right shape, and the validator that enforces the shape so malformed output is corrected before the user sees it.

## 4.5 Grounding: the model never invents the world

The strongest business rule in tripleF is **grounding**. Research answers are built only from evidence the system actually gathered:
- sources must come from the search results, never guessed;
- media URLs must come from the search results, never invented;
- previously shown media must not be repeated;
- URLs must point at real, embeddable, and trustworthy targets.

This is what separates an agentic workbench from a chat that merely happens to have internet access. The model reasons about evidence; it does not fabricate it.

**What it relies on:** the search and scraping tools, the URL safety and trust checks, and the validation pass that rejects or repairs outputs which violate the rules.

## 4.6 Long conversations and context

Because models have a finite attention window, conversations are summarised (compacted) when they grow long. The summary preserves both the shape and the facts — what was shown and what was answered — so the next turn continues seamlessly. Cancellation is cooperative and best-effort: work stops between stages, not mid-call, which keeps the system responsive without wasting a half-finished model run.

**What it relies on:** the compaction job, the persistence layer that stores conversation state, and the real-time channel that tells the UI the conversation is being folded.

## 4.7 The whole, at a glance

| Feature | How it behaves for the user | What it depends on |
| --- | --- | --- |
| Chat and structured answers | Typed, live, richly rendered responses | Model runtime, intent classifier, answer shapes, validator, real-time streaming |
| Grounded research | Answers cite real sources and media; nothing is invented | Search tools, scraping, URL trust and safety, dedup across history |
| Video playlists | Curated, ordered, playable, persistent, deduped | Video search, embeddable-provider allow-list, title/caption contract, browser-persisted playlist, single floating player |
| Image collections | Quality-filtered, deduped, locally stored | Image search, ingestion and preprocessing, object storage |
| Long conversations | Auto-summarised and continuous | Compaction, persistence, streaming |
| Persistence and reliability | Work survives failure, retries, and restarts | Queue, database, object storage, key store |

## 4.8 The trust boundary

Every feature ultimately leans on one principle: **the model proposes, the system disposes.** The model generates ideas and structure; the system gathers evidence, validates shape, enforces media contracts, and filters out whatever cannot be trusted or embedded. Architects should keep this boundary in mind when extending the product — new features should grow the "system" side (rules, validation, grounding) rather than trusting the "model" side to behave. That design philosophy is what keeps tripleF reliable even though the underlying models are free, local, and fallible.

## Related reading

- For the mechanics behind the loop: **1.2 (The Harness)** and **2.2 (The Chat Experience)**.
- For how conversations are stored and compacted: **1.5 (Data & Storage)** and **1.3 (BullMQ Async Processing)**.
- For the real-time transport that streams answers: **1.4 (Socket.IO Real-time Layer)**.
- For how the UI is architected to render these features: **2.1 (Frontend Architecture)**.
