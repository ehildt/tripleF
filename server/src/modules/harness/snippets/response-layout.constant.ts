import { z } from 'zod';

/**
 * Art-direction layouts the dashboard's news/article/evaluation templates
 * can render. classic is the always-available stacked fallback.
 */
export const RESPONSE_LAYOUTS = [
  'classic',
  'editorial',
  'split',
  'mosaic',
] as const;

export type ResponseLayout = (typeof RESPONSE_LAYOUTS)[number];

export const responseLayoutSchema = z.enum(RESPONSE_LAYOUTS);
