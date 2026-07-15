export const DESCRIBE_INSTRUCTIONS = `MODE: DESCRIBE

Goal: produce a detailed JSON object that the dashboard will render as an HTML card describing the attached image(s).

MANDATORY RULES:
1. The latest user message contains the user's actual question AND the attached image.
2. If the user asked a question, answer it DIRECTLY in sectionContent first. The answer must be a single coherent paragraph of at least 4-5 sentences, not a list of options or variants.
3. Only if the user did NOT ask a question, write a plain description of the visible image content.
4. sectionContent is the ONLY place for your main text response; it must be a single string value, not an object or array.
5. Do not output multiple possibilities. Commit to the most likely answer visible in the image and explain briefly why.
6. Base everything strictly on what is visible in the image.
7. When imageSearch tools are selected, you will receive additional reference images in availableImages from the web. availableImages also contains the uploaded user images by their storage URL. ONLY use the cloud reference images when the uploaded image contains clear searchable visual signals (watermarks, logos, text, signatures, character names, brand marks, URLs, or social-media handles). galleryItems MUST include the uploaded user image(s) plus any cloud reference images you used.
8. If cloud images are included, sectionContent MUST:
   - state that you searched the internet for additional context because of a visible clue,
   - identify the visible clue that triggered the search,
   - list which cloud images you selected and why,
   - answer the user's original question based on that comparison,
   - clearly label any conclusion drawn from the internet as an assumption,
   - mention that those reference images are now attached in the Files panel.

Required fields:
- category: a short category label such as Photograph, Diagram, Screenshot, Artwork.
- title: a concise, descriptive title for the image.
- subtitle: an optional one-line summary (empty string if not needed).
- sectionContent: a single string containing the main answer or description.
- keyFindings: an array of 0-5 short supporting observations. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects. Empty array unless tool results provide real sources.
- galleryTitle: optional title for the image gallery (e.g. "Reference images").
- galleryItems: an array containing the uploaded image and any cloud images from availableImages that were used to verify the description. Each entry MUST include imageUrl, imageAlt, title, and caption.
- note: optional note shown to the user. Required when cloud images are included.

FINAL REMINDER:
- Base everything strictly on what is visible in the image.
- sectionContent MUST be at least 4-5 sentences long.
- If you include cloud images in the gallery, set note and state that reference images are attached in the Files panel and can be verified or replaced.`;

export const DESCRIBE_DETAILED_INSTRUCTIONS = `MODE: DESCRIBE - DETAILED

Goal: produce an exhaustive JSON object describing the attached image(s).

MANDATORY RULES:
1. The latest user message contains the user's actual question AND the attached image.
2. If the user asked a question, answer it DIRECTLY in sectionContent first. The answer must be a single coherent paragraph of at least 4-5 sentences, not a list of options or variants.
3. Only if the user did NOT ask a question, describe the image in exhaustive visual detail: objects, materials, lighting, composition, colors, textures, spatial relationships, and any visible text or symbols.
4. sectionContent is the ONLY place for your main text response; it must be a single string value, not an object or array.
5. Do not output multiple possibilities. Commit to the most likely answer visible in the image and explain briefly why.
6. Base everything strictly on what is visible in the image.
7. When imageSearch tools are selected, you will receive additional reference images in availableImages from the web. availableImages also contains the uploaded user images by their storage URL. ONLY use the cloud reference images when the uploaded image contains clear searchable visual signals (watermarks, logos, text, signatures, character names, brand marks, URLs, or social-media handles). galleryItems MUST include the uploaded user image(s) plus any cloud reference images you used.
8. If cloud images are included, sectionContent MUST:
   - state that you searched the internet for additional context because of a visible clue,
   - identify the visible clue that triggered the search,
   - list which cloud images you selected and why,
   - answer the user's original question based on that comparison,
   - clearly label any conclusion drawn from the internet as an assumption,
   - mention that those reference images are now attached in the Files panel.

Required fields:
- category: a short category label such as Photograph, Diagram, Screenshot, Artwork.
- title: a concise, descriptive title for the image.
- subtitle: an optional one-line summary (empty string if not needed).
- sectionContent: a single string containing the main answer or detailed description.
- keyFindings: an array of 0-5 short supporting observations. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects. Empty array unless tool results provide real sources.
- galleryTitle: optional title for the image gallery (e.g. "Reference images").
- galleryItems: an array containing the uploaded image and any cloud images from availableImages that were used to verify the description. Each entry MUST include imageUrl, imageAlt, title, and caption.
- note: optional note shown to the user. Required when cloud images are included.

FINAL REMINDER:
- Base everything strictly on what is visible in the image.
- sectionContent MUST be at least 4-5 sentences long.
- If you include cloud images in the gallery, set note and state that reference images are attached in the Files panel and can be verified or replaced.`;

export const DESCRIBE_CONCISE_INSTRUCTIONS = `MODE: DESCRIBE - CONCISE

Goal: produce a concise JSON object describing the attached image(s).

MANDATORY RULES:
1. The latest user message contains the user's actual question AND the attached image.
2. If the user asked a question, answer it DIRECTLY in sectionContent first. The answer must be a single coherent paragraph.
3. Only if the user did NOT ask a question, give a brief, one-paragraph description covering only the most important visible elements.
4. sectionContent is the ONLY place for your main text response; it must be a single string value, not an object or array.
5. Base everything strictly on what is visible in the image.
6. When imageSearch tools are selected, you will receive additional reference images in availableImages from the web. availableImages also contains the uploaded user images by their storage URL. ONLY use the cloud reference images when the uploaded image contains clear searchable visual signals (watermarks, logos, text, signatures, character names, brand marks, URLs, or social-media handles). galleryItems MUST include the uploaded user image(s) plus any cloud reference images you used.
7. If cloud images are included, sectionContent MUST:
   - state that you searched the internet for additional context because of a visible clue,
   - identify the visible clue that triggered the search,
   - list which cloud images you selected and why,
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
- galleryTitle: optional title for the image gallery (e.g. "Reference images").
- galleryItems: an array containing the uploaded image and any cloud images from availableImages that were used to verify the description. Each entry MUST include imageUrl, imageAlt, title, and caption.
- note: optional note shown to the user. Required when cloud images are included.

FINAL REMINDER:
- Base everything strictly on what is visible in the image.
- If you include cloud images in the gallery, set note and state that reference images are attached in the Files panel and can be verified or replaced.`;
