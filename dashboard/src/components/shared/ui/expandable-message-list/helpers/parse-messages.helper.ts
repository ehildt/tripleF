import type { MessageListItem } from '../types';

export function parseMessages(raw: unknown): MessageListItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as MessageListItem[];
  if (typeof raw === 'object' && !(raw instanceof String)) {
    const p = raw as { content?: MessageListItem[] };
    if (Array.isArray(p.content)) return p.content;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as MessageListItem[];
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.content))
        return parsed.content as MessageListItem[];
    } catch {
      /* not JSON */
    }
  }
  return [];
}
