export const ITEM_SHAPES = `JSON SHAPE EXAMPLE (article-shaped — the TEMPLATE and required/optional key list above define the actual keys you return)
{
  "category": "Gaming",
  "title": "Nioh 3 Review",
  "sectionContent": "Team Ninja returns with the third entry.\\n\\nCombat remains the core strength.",
  "keyFindings": [{ "text": "Open-world exploration replaces the mission structure." }],
  "sources": [{ "url": "https://example.com", "title": "Example" }]
}

ITEM SHAPES
- keyFindings, keyPoints, strengths, weaknesses, recommendations, pros, and cons entries must be objects with exactly one key: "text".
  Example: [{ "text": "The protagonist is a skilled warrior." }]

- galleryItems entries must include imageUrl, imageAlt, title, and caption. imageAlt and title must be non-empty descriptive strings.
  Example: [{ "imageUrl": "https://example.com/img.jpg", "imageAlt": "A red sports car parked on a cobblestone street", "title": "Red sports car", "caption": "Front three-quarter view" }]

- videoGalleryItems entries must include videoUrl, title, and caption. title and caption must be non-empty descriptive strings.
  Example: [{ "videoUrl": "https://www.youtube.com/watch?v=ID", "title": "Official gameplay trailer", "caption": "First footage from the reveal" }]

- shopOffers entries need title, price, source, link, and may include imageUrl, delivery, rating, and ratingCount. link must be a direct URL to the product page on the merchant's website; when no product page URL is available, link the merchant's homepage. Google Shopping, Google search, and Google redirect links (google.com/shopping, /search, /aclk) are forbidden — never emit them.`;
