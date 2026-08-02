export type ToolCategory =
  | 'web'
  | 'images'
  | 'videos'
  | 'news'
  | 'shopping'
  | 'reviews'
  | 'places'
  | 'fetch'
  | 'browser'
  | 'variants'
  | 'other';

/**
 * Map a concrete tool name to a stable activity category. The client groups
 * simultaneous tool calls by category so parallel searches (e.g. webSearch
 * and serperWebSearch) render as one activity instead of flickering duplicates.
 *
 * Order matters: check the most specific suffixes before generic "search".
 */
export function resolveToolCategory(toolName: string): ToolCategory {
  if (toolName.startsWith('browser_')) return 'browser';
  if (toolName.startsWith('request')) return 'variants';
  if (/shopping/i.test(toolName)) return 'shopping';
  if (/review/i.test(toolName)) return 'reviews';
  if (/place/i.test(toolName)) return 'places';
  if (/imageSearch/i.test(toolName)) return 'images';
  if (/videoSearch/i.test(toolName)) return 'videos';
  if (/newsSearch/i.test(toolName)) return 'news';
  if (/fetch|webpage/i.test(toolName)) return 'fetch';
  if (/search|web/i.test(toolName)) return 'web';
  return 'other';
}
