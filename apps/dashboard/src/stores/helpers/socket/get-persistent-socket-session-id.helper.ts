import { createId } from '../../../utils/id.helper';

const STORAGE_KEY = 'socket-conversation-id';

/**
 * Returns a stable socket conversation id for this browser.
 * The id is persisted in localStorage so it survives reconnects
 * and page reloads, giving the server a consistent client identity.
 */
export function getPersistentSocketSessionId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage may be unavailable (private mode, blocked, etc.).
  }

  const id = createId();

  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Ignore storage failures and fall back to an in-memory id.
  }

  return id;
}
