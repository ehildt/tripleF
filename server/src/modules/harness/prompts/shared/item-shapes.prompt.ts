export const ITEM_SHAPES = `ITEM SHAPES
- keyFindings, keyPoints, strengths, weaknesses, recommendations, pros, cons, and reviewSummary entries must be objects with exactly one key: "text".
  Example: [{ "text": "The protagonist is a skilled warrior." }]

- galleryItems entries must include imageUrl, imageAlt, title, and caption. imageAlt and title must be non-empty descriptive strings.
  Example: [{ "imageUrl": "https://example.com/img.jpg", "imageAlt": "A red sports car parked on a cobblestone street", "title": "Red sports car", "caption": "Front three-quarter view" }]

- videoGalleryItems entries must include videoUrl, title, and caption. title and caption must be non-empty descriptive strings.
  Example: [{ "videoUrl": "https://www.youtube.com/watch?v=ID", "title": "Official gameplay trailer", "caption": "First footage from the reveal" }]

- shopOffers entries need title, price, source, link, and may include imageUrl, delivery, rating, and ratingCount.`;
