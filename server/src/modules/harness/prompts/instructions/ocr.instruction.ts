export const OCR_INSTRUCTIONS = `MODE: OCR

Goal: produce a JSON object containing the visible text from the attached image(s).

MANDATORY RULES:
1. Transcribe only the text visible in the image.
2. If the extracted text contains URLs, social-media handles, brand names, or other named entities AND the user asks you to identify or explain them, you MAY use webSearch/webFetch to look them up.
3. If you use webSearch/webFetch, sectionContent MUST:
   - state that you searched the internet because of a visible clue,
   - identify the visible clue,
   - clearly label any conclusion drawn from the internet as an assumption,
   - mention that reference images or sources are attached in the Files panel if applicable.

Required fields:
- category: a short category label such as Document, Sign, Code, Label.
- title: a concise, descriptive title for the IMAGE or DOCUMENT (e.g., "Receipt", "Street Sign", "Code Snippet"). NOT a copy of the extracted text.
- subtitle: an optional one-line summary of what the image shows (empty string if not needed). NOT a copy of the extracted text.
- sectionContent: the extracted text ONLY, as a single JSON string value. Preserve structure and line breaks by using the escaped newline sequence \\n between lines or paragraphs — never literal line breaks inside the JSON string.
- keyFindings: an array of 0–5 short observations ABOUT the image/text. Each entry MUST be an object with exactly one key: "text".

Rules:
- Never emit placeholder text such as "undefined", "null", "none", or "n/a". Use an empty string or empty array instead.
- Transcribe only the text visible in the image.
- Do not correct spelling or grammar unless instructed.
- Preserve the original layout when possible.
- Do not leave sectionContent empty.
- title and subtitle must describe the image/document. They must NEVER repeat or summarize the extracted text from sectionContent.
- keyFindings must be short OBSERVATIONS about the image/text. NEVER repeat or summarize the extracted text from sectionContent.

FINAL REMINDER:
- Transcribe only the text visible in the image.`;

export const OCR_VERBATIM_INSTRUCTIONS = `MODE: OCR — VERBATIM

Goal: produce a JSON object containing the visible text from the attached image(s), transcribed exactly as it appears.

MANDATORY RULES:
1. Transcribe the visible text exactly as it appears, without reformatting, summarizing, or correcting errors.
2. If the extracted text contains URLs, social-media handles, brand names, or other named entities AND the user asks you to identify or explain them, you MAY use webSearch/webFetch to look them up.
3. If you use webSearch/webFetch, sectionContent MUST:
   - state that you searched the internet because of a visible clue,
   - identify the visible clue,
   - clearly label any conclusion drawn from the internet as an assumption,
   - mention that reference images or sources are attached in the Files panel if applicable.

Required fields:
- category: a short category label such as Document, Sign, Code, Label.
- title: a concise, descriptive title for the IMAGE or DOCUMENT. NOT a copy of the extracted text.
- subtitle: an optional one-line summary of what the image shows (empty string if not needed). NOT a copy of the extracted text.
- sectionContent: the extracted text ONLY, as a single JSON string value. Preserve the original structure, line breaks, and formatting by using the escaped newline sequence \\n — never literal line breaks inside the JSON string.
- keyFindings: an array of 0–5 short observations ABOUT the image/text. Each entry MUST be an object with exactly one key: "text".

Rules:
- Never emit placeholder text such as "undefined", "null", "none", or "n/a". Use an empty string or empty array instead.
- Transcribe the visible text exactly as it appears, without reformatting, summarizing, or correcting errors.
- Preserve the original layout and formatting when possible.
- Do not leave sectionContent empty.
- title and subtitle must describe the image/document. They must NEVER repeat or summarize the extracted text from sectionContent.
- keyFindings must be short OBSERVATIONS about the image/text. NEVER repeat or summarize the extracted text from sectionContent.

FINAL REMINDER:
- Transcribe only the text visible in the image, exactly as it appears.`;
