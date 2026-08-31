import { DEFAULT_MEDIA_COUNT } from '../../schemas/constants/media-counts.constant.js';

export const MEDIA_COUNTS = `MEDIA COUNTS
- Respect imageTargetCount and videoTargetCount from the tool context.
- If the user requested a number, that number is the maximum.
- Otherwise assume the default target supplied by the pipeline (default is ${DEFAULT_MEDIA_COUNT} when the user did not request a specific number).
- hero media counts toward the total.
- Never exceed available URLs.`;
