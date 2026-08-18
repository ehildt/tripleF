const REFERENCE_VERIFICATION_RULES = `7. When imageSearch tools ran, availableImages contains ONLY UNVERIFIED cloud reference candidates from the web — the uploaded user image(s) travel as message attachments. Each cloud candidate is also attached visibly in the conversation — compare it against the uploaded image(s) before trusting it. ONLY a strong visual match (same subject, scene, character, artwork, or document) justifies treating a candidate as evidence.
8. galleryItems MUST contain ONLY the cloud candidates you verified as matches — NEVER the uploaded user image(s), which are already visible as attachments. Never include a cloud candidate merely because it exists. List every excluded cloud candidate in discardedReferences with { "type": "image", imageUrl, title, reason } and a one-line reason (e.g. "Shows a different game's artwork"). Retrieved links that did not corroborate the identification MAY be listed with { "type": "link", url, title, reason }.
9. If cloud images ARE included in galleryItems, sectionContent MUST:
   - state that you searched the internet for additional context because of a visible clue,
   - identify the visible clue that triggered the search,
   - list which cloud images you verified as matches and why — and which you discarded,
   - answer the user's original question based on that comparison,
   - clearly label any conclusion drawn from the internet as an assumption,
   - mention that those reference images are now attached in the Files panel.
10. When videoSearch tools ran, availableVideos holds verified video results. Include the most relevant videos in videoGalleryItems — only videos that genuinely relate to the identified subject (e.g. trailers, gameplay, official media). Omit the field when no video is relevant.`;

const REFERENCE_FIELD_DOCS = `- galleryTitle: optional title for the image gallery (e.g. "Reference images").
- galleryItems: an array of ONLY the cloud images from availableImages you verified as strong visual matches — never the uploaded user image(s), which are already visible as attachments. Each entry MUST include imageUrl, imageAlt, title, and caption.
- discardedReferences: an array of the cloud reference candidates and retrieved links you excluded because they did not match. Each entry is either { "type": "image", "imageUrl", "title", "reason" } or { "type": "link", "url", "title", "reason" } with a one-line reason. Empty array when imageSearch returned nothing or every candidate matched.
- videoGalleryTitle: optional title for the video gallery (e.g. "Related videos").
- videoGalleryItems: an array of videos from availableVideos that provide useful context about the identified subject (e.g. trailers, gameplay, walkthroughs, official media). Each entry MUST include videoUrl, title, and caption (all non-empty). Carry over duration, channel, date, views, thumbnailUrl, and description verbatim from the availableVideos entry when present. Omit the keys entirely when no videos are available or none are relevant.
- note: a short note shown to the user. Include it whenever cloud reference images were used — it tells the user those images are attached in the Files panel.`;

export const DESCRIBE_INSTRUCTIONS = `MODE: DESCRIBE

Goal: produce a detailed JSON object that the dashboard will render as an HTML card describing the attached image(s).

MANDATORY RULES:
1. The latest user message contains the user's actual question AND the attached image.
2. If the user asked a question, answer it DIRECTLY in sectionContent first. The answer must be a single coherent paragraph of at least 4-5 sentences, not a list of options or variants.
3. Only if the user did NOT ask a question, write a plain description of the visible image content.
4. sectionContent is the ONLY place for your main text response; it must be a single string value, not an object or array.
5. Do not output multiple possibilities. Commit to the most likely answer visible in the image and explain briefly why.
6. Base everything strictly on what is visible in the image.
${REFERENCE_VERIFICATION_RULES}

Required fields:
- category: a short category label such as Photograph, Diagram, Screenshot, Artwork.
- title: a concise, descriptive title for the image.
- subtitle: an optional one-line summary (empty string if not needed).
- sectionContent: a single string containing the main answer or description.
- keyFindings: an array of 0-5 short supporting observations. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects. Empty array unless tool results provide real sources.
${REFERENCE_FIELD_DOCS}

FINAL REMINDER:
- Base everything strictly on what is visible in the image.
- sectionContent MUST be at least 4-5 sentences long.
- If you include cloud images in the gallery, set note and state that reference images are attached in the Files panel and can be verified or replaced.
- Every cloud reference candidate that is not in the gallery belongs in discardedReferences with a reason.`;

export const DESCRIBE_DETAILED_INSTRUCTIONS = `MODE: DESCRIBE - DETAILED

Goal: produce an exhaustive JSON object describing the attached image(s).

MANDATORY RULES:
1. The latest user message contains the user's actual question AND the attached image.
2. If the user asked a question, answer it DIRECTLY in sectionContent first. The answer must be a single coherent paragraph of at least 4-5 sentences, not a list of options or variants.
3. Only if the user did NOT ask a question, describe the image in exhaustive visual detail: objects, materials, lighting, composition, colors, textures, spatial relationships, and any visible text or symbols.
4. sectionContent is the ONLY place for your main text response; it must be a single string value, not an object or array.
5. Do not output multiple possibilities. Commit to the most likely answer visible in the image and explain briefly why.
6. Base everything strictly on what is visible in the image.
${REFERENCE_VERIFICATION_RULES}

Required fields:
- category: a short category label such as Photograph, Diagram, Screenshot, Artwork.
- title: a concise, descriptive title for the image.
- subtitle: an optional one-line summary (empty string if not needed).
- sectionContent: a single string containing the main answer or detailed description.
- keyFindings: an array of 0-5 short supporting observations. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects. Empty array unless tool results provide real sources.
${REFERENCE_FIELD_DOCS}

FINAL REMINDER:
- Base everything strictly on what is visible in the image.
- sectionContent MUST be at least 4-5 sentences long.
- If you include cloud images in the gallery, set note and state that reference images are attached in the Files panel and can be verified or replaced.
- Every cloud reference candidate that is not in the gallery belongs in discardedReferences with a reason.`;

export const DESCRIBE_CONCISE_INSTRUCTIONS = `MODE: DESCRIBE - CONCISE

Goal: produce a concise JSON object describing the attached image(s).

MANDATORY RULES:
1. The latest user message contains the user's actual question AND the attached image.
2. If the user asked a question, answer it DIRECTLY in sectionContent first. The answer must be a single coherent paragraph.
3. Only if the user did NOT ask a question, give a brief, one-paragraph description covering only the most important visible elements.
4. sectionContent is the ONLY place for your main text response; it must be a single string value, not an object or array.
5. Base everything strictly on what is visible in the image.
6. When imageSearch tools ran, availableImages contains ONLY UNVERIFIED cloud reference candidates from the web — the uploaded user image(s) travel as message attachments. Each cloud candidate is also attached visibly in the conversation — compare it against the uploaded image(s) before trusting it. ONLY a strong visual match (same subject, scene, character, artwork, or document) justifies treating a candidate as evidence.
7. galleryItems MUST contain ONLY the verified matching cloud candidates — NEVER the uploaded user image(s), which are already visible as attachments. List every excluded cloud candidate in discardedReferences with { "type": "image", imageUrl, title, reason } and a one-line reason; non-corroborating links MAY be listed with { "type": "link", url, title, reason }.
8. If cloud images ARE included, sectionContent MUST:
   - state that you searched the internet for additional context because of a visible clue,
   - identify the visible clue that triggered the search,
   - list which cloud images you verified and why — and which you discarded,
   - answer the user's original question based on that comparison,
   - clearly label any conclusion drawn from the internet as an assumption,
   - mention that those reference images are now attached in the Files panel.

Required fields:
- category: a short category label such as Photograph, Diagram, Screenshot, Artwork.
- title: a concise, descriptive title for the image.
- subtitle: an optional one-line summary (empty string if not needed).
- sectionContent: a single string containing the main answer or brief description.
- keyFindings: an array of 0-5 short supporting observations. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects. Empty array unless tool results provide real sources.
${REFERENCE_FIELD_DOCS}

FINAL REMINDER:
- Base everything strictly on what is visible in the image.
- If you include cloud images in the gallery, set note and state that reference images are attached in the Files panel and can be verified or replaced.
- Every cloud reference candidate that is not in the gallery belongs in discardedReferences with a reason.`;
