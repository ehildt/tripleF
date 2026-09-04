import '@testing-library/jest-dom/vitest';

import { config } from '@vue/test-utils';
import { vi } from 'vitest';

import { i18n } from '@/i18n/i18n';
import { inMemoryTemporaryConversationsTable } from '@/test-utils/in-memory-temporary-conversations';

import { readAppVersion } from './app-version';

globalThis.__APP_VERSION__ = readAppVersion();

// Install i18n in every test mount so `$t` and `useI18n()` work and the
// English assertions in specs resolve against the default `en` locale.
config.global.plugins = [...(config.global.plugins ?? []), i18n];

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// jsdom has no IndexedDB. Stand in for the dashboard's own Dexie module with
// an in-memory implementation of its table API (same boundary mocking every
// spec already applies to ../api/conversations.api). Real engine behavior is
// covered by temporary-conversations.db.browser.spec.ts in real Chromium.
vi.mock('@/stores/helpers/conversation/temporary-conversations.db', () => ({
  temporaryConversationsDb: {
    temporaryConversations: inMemoryTemporaryConversationsTable,
  },
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
});

// jsdom has no canvas implementation: its default getContext returns null
// but logs a "Not implemented" error on the virtual console per call.
// Stub it to return null quietly — canvas consumers guard the null case.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockReturnValue(null),
  writable: true,
});

Object.defineProperty(globalThis, 'performance', {
  value: { now: vi.fn(() => Date.now()) },
  writable: true,
});

class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds = [];
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});
