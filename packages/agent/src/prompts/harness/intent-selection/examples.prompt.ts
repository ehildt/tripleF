/**
 * Canonical classification examples: news-vs-article disambiguation, product
 * vs shoplist follow-ups, media lists, information comparisons, and media
 * follow-ups on an established topic.
 */
export const TEMPLATE_SELECTION_EXAMPLES = `TEMPLATE SELECTION EXAMPLES
Use these examples to resolve "news" vs "article":
- User: "What is the latest news on Gaza?" → template: "news", tools: [serperWebSearch, serperNewsSearch, serperImageSearch, serperVideoSearch]
- User: "Write an in-depth report on the Gaza conflict." → template: "article", tools: [serperWebSearch, serperImageSearch, serperVideoSearch]
- User: "Any Nioh 3 news?" → template: "news", tools: [serperWebSearch, serperNewsSearch, serperImageSearch, serperVideoSearch]
- User: "Research the history of the Nioh series." → template: "article", tools: [serperWebSearch, serperImageSearch, serperVideoSearch]
- User: "Show me breaking news about AI." → template: "news", tools: [serperWebSearch, serperNewsSearch, serperImageSearch, serperVideoSearch]
- User: "Summarize recent announcements from OpenAI." → template: "news", tools: [serperWebSearch, serperNewsSearch, serperImageSearch, serperVideoSearch]
- User: "What is the price of iPhone 16?" → template: "product", tools: [serperWebSearch, serperShoppingSearch, serperImageSearch, serperVideoSearch]
- User: "best budget mechanical keyboard with prices" → template: "product", tools: [serperWebSearch, serperShoppingSearch, serperImageSearch, serperVideoSearch]
- User: "where can I buy Sony WH-1000XM5?" → template: "product", tools: [serperWebSearch, serperShoppingSearch, serperImageSearch, serperVideoSearch]
- (After a full product overview for Sony WH-1000XM5) User: "where else can I get it?" → template: "shoplist", tools: [serperWebSearch, serperShoppingSearch, serperImageSearch]
- (After a full product overview for iPhone 16) User: "any cheaper shops for it?" → template: "shoplist", tools: [serperWebSearch, serperShoppingSearch, serperImageSearch]
- (After a full product overview for iPhone 16) User: "what about the Pixel 9 — where to buy?" → template: "product" (different product), tools: [serperWebSearch, serperShoppingSearch, serperImageSearch, serperVideoSearch]
- User: "show me wallpapers of the Gothic remake" → template: "imagelist", tools: [serperImageSearch]
- User: "find pictures of Neuschwanstein castle" → template: "imagelist", tools: [serperImageSearch]
- User: "find me music videos of Daft Punk on YouTube" → template: "videolist", tools: [youtubeVideoSearch]
- User: "give me a playlist of the best Nioh 3 trailers" → template: "videolist", tools: [serperVideoSearch]
- User: "latest music videos from Billie Eilish" → template: "videolist", tools: [serperVideoSearch]
- User: "how does NTE compare to Wuthering Waves?" → template: "evaluation", tools: [serperWebSearch, serperImageSearch, serperVideoSearch]
- User: "iPhone 16 Pro vs Pixel 9 Pro — which camera is better?" → template: "evaluation", tools: [serperWebSearch, serperImageSearch, serperVideoSearch]

Follow-up media requests (user adds images/videos/news to established topic):
- User: "show me images" (after discussing a game) → template: "article", tools: [serperWebSearch, serperImageSearch, serperVideoSearch]
- User: "bilder videos news dazu" (German — images, videos, news please) → template: "article", tools: [serperWebSearch, serperNewsSearch, serperImageSearch, serperVideoSearch]
- User: "more media about this" → template: "article", tools: [serperWebSearch, serperImageSearch, serperVideoSearch]
- User: "just the images" (after an article) → template: "imagelist", tools: [serperImageSearch]
- User: "only the videos, as a playlist" (after an article) → template: "videolist", tools: [serperVideoSearch]`;
