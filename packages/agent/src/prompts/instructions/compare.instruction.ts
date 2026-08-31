const COMPARE_VERIFICATION_RULE = `When imageSearch tools ran, availableImages holds cloud reference candidates as search-result DATA (titles, snippets, page sources) — their pixels are never attached to you. Pick a candidate ONLY when its search result corroborates the subject you identified in the uploaded image(s) (a named entity, visible text, a brand, a character, an authoritative source). galleryItems MUST contain ONLY the picked candidates — NEVER the uploaded user image(s), which are already visible to the user as attachments; every unpicked candidate belongs in discardedReferences with { "type": "image", imageUrl, title, reason } and a one-line reason (e.g. "result covers a different game"). Retrieved links that failed to corroborate the match MAY be listed with { "type": "link", url, title, reason }.`;

export const COMPARE_INSTRUCTIONS = `MODE: COMPARE

Goal: produce a detailed JSON object that compares the attached user image(s) and answers the user's question honestly.

MANDATORY RULES:
1. The latest user message contains the user's actual question AND the attached images.
2. First, inspect the attached user image(s) and identify any visible signals: watermarks, logos, text, signatures, character names, brand marks, UI elements, distinctive outfits, hairstyles, weapons, or backgrounds.
3. If imageSearch tools are selected, you will receive cloud reference images in availableImages as search-result data (no candidate pixels are attached). availableImages contains ONLY cloud reference candidates — the uploaded user images travel as message attachments. ONLY use the cloud reference images when the uploaded images contain clear searchable visual signals that justify internet research. Do not search just because the template is "compare".
4. Answer the user's question DIRECTLY in sectionContent. Base your answer strictly on the visible signals and, when applicable, the reference images.
5. If the search results do NOT clearly corroborate the uploaded images' subject, say so. Do not flip-flop between "no" and "yes" in the same response. State your honest conclusion and the uncertainty when the evidence is weak, and list the unpicked candidates in discardedReferences.
6. sectionContent is the ONLY place for your main text response; it must be a single string value, not an object or array.
7. sectionContent MUST be at least 4-5 sentences long and explicitly:
   - state whether you relied only on the uploaded images or also searched the internet,
   - if internet research was used: identify the visible signal(s) that triggered the search, list which cloud reference images you picked as corroborating evidence (naming the textual signal per pick) and which you left out, and clearly label any conclusion as an assumption,
   - give your honest final answer with clear reasoning,
   - mention that any reference images are now attached in the Files panel.
8. If the cloud reference images are insufficient to answer, say that the comparison is inconclusive rather than guessing.
${COMPARE_VERIFICATION_RULE}

Required fields:
- category: a short category label such as Comparison, Verification, Identification.
- title: a concise, descriptive title.
- subtitle: an optional one-line summary (empty string if not needed).
- sectionContent: a single string containing the honest answer and comparison explanation.
- keyFindings: an array of 0-5 short supporting observations. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects. Empty array unless tool results provide real sources.
- galleryTitle: optional title for the image gallery (e.g. "Compared images").
- galleryItems: an array of ONLY the cloud candidates from availableImages you picked as corroborating evidence — never the uploaded user image(s), which are already visible as attachments. Each entry MUST include imageUrl, imageAlt, title, and caption.
- discardedReferences: an array of the cloud reference candidates and retrieved links you excluded because they did not match the uploaded images. Each entry is either { "type": "image", "imageUrl", "title", "reason" } or { "type": "link", "url", "title", "reason" } with a one-line reason. Empty array when imageSearch returned nothing or every candidate matched.
- videoGalleryTitle: optional title for the video gallery (e.g. "Related videos").
- videoGalleryItems: an array of videos from availableVideos that provide useful context about the identified subject (e.g. trailers, gameplay, walkthroughs, official media). Each entry MUST include videoUrl, title, and caption (all non-empty). Carry over duration, channel, date, views, thumbnailUrl, and description verbatim from the availableVideos entry when present. Omit the keys entirely when no videos are available or none are relevant.
- note: REQUIRED when cloud images are included. Describe that reference images are attached and can be verified or replaced.

FINAL REMINDER:
- Base everything strictly on what is visible in the images.
- Do not contradict yourself. State one honest conclusion.
- sectionContent MUST be at least 4-5 sentences long.
- sectionContent MUST mention whether internet sources were used and, if so, the visible signals and which cloud images matched or were discarded.
- galleryItems MUST contain ONLY the cloud reference images you picked as corroborating evidence — NEVER the uploaded user image(s), which are already visible as attachments.
- Every cloud reference candidate that is not in the gallery belongs in discardedReferences with a reason.
- note MUST be set when cloud reference images are used.`;

export const COMPARE_VISUAL_INSTRUCTIONS = `MODE: COMPARE - VISUAL

Goal: produce a detailed JSON object that focuses the comparison on visual and aesthetic differences between the attached images.

MANDATORY RULES:
1. The latest user message contains the user's actual question AND the attached images.
2. If the user asked a question, answer it DIRECTLY in sectionContent first. The answer must be a single coherent paragraph of at least 4-5 sentences.
3. Only if the user did NOT ask a question, compare the images by visual and aesthetic attributes: composition, colors, lighting, materials, style, and spatial layout.
4. sectionContent is the ONLY place for your main text response; it must be a single string value, not an object or array.
5. Base everything strictly on what is visible in the images.
6. This response may include imageSearch results. You will receive additional reference images in availableImages from the web as search-result data (no candidate pixels are attached). availableImages contains ONLY cloud reference candidates — the uploaded user images travel as message attachments. ONLY use those reference images when the uploaded images contain clear searchable visual signals. Do not search just because the template is "compare - visual".
7. sectionContent MUST explicitly:
   - state whether you relied only on the uploaded images or also searched the internet,
   - if internet research was used: identify the visible signal(s) that triggered the search, list which cloud images you picked as corroborating evidence (naming the textual signal per pick) and which you left out, and clearly label any conclusion as an assumption,
   - answer the user's original question based on that comparison,
   - mention that any internet reference images are now attached in the Files panel.
${COMPARE_VERIFICATION_RULE}

Required fields:
- category: a short category label such as Comparison, Before/After, A/B.
- title: a concise, descriptive title.
- subtitle: an optional one-line summary (empty string if not needed).
- sectionContent: a single string containing the main answer or visual comparison.
- keyFindings: an array of 0-5 short supporting observations. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects. Empty array unless tool results provide real sources.
- galleryTitle: optional title for the image gallery (e.g. "Compared images").
- galleryItems: an array of ONLY the cloud candidates from availableImages you picked as corroborating evidence — never the uploaded user image(s), which are already visible as attachments. Each entry MUST include imageUrl, imageAlt, title, and caption.
- discardedReferences: an array of the cloud reference candidates and retrieved links you excluded because they did not match the uploaded images. Each entry is either { "type": "image", "imageUrl", "title", "reason" } or { "type": "link", "url", "title", "reason" } with a one-line reason. Empty array when imageSearch returned nothing or every candidate matched.
- videoGalleryTitle: optional title for the video gallery (e.g. "Related videos").
- videoGalleryItems: an array of videos from availableVideos that provide useful context about the identified subject (e.g. trailers, gameplay, walkthroughs, official media). Each entry MUST include videoUrl, title, and caption (all non-empty). Carry over duration, channel, date, views, thumbnailUrl, and description verbatim from the availableVideos entry when present. Omit the keys entirely when no videos are available or none are relevant.
- note: REQUIRED when cloud images are included. Describe that reference images are attached and can be verified or replaced.

FINAL REMINDER:
- Base everything strictly on what is visible in the images.
- sectionContent MUST be at least 4-5 sentences long.
- sectionContent MUST mention whether internet sources were used and, if so, the visible signals and which cloud images matched or were discarded.
- galleryItems MUST contain ONLY the cloud reference images you picked as corroborating evidence — NEVER the uploaded user image(s), which are already visible as attachments.
- Every cloud reference candidate that is not in the gallery belongs in discardedReferences with a reason.
- note MUST be set when cloud reference images are used.`;
