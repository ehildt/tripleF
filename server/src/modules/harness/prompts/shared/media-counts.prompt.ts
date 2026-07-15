export const MEDIA_COUNTS = `MEDIA COUNTS
- Respect imageTargetCount and videoTargetCount from the tool context.
- If the user requested a number, that number is the maximum.
- Otherwise assume the default target supplied by the pipeline (default is 6 when the user did not request a specific number).
- hero media counts toward the total.
- Never exceed available URLs.`;
