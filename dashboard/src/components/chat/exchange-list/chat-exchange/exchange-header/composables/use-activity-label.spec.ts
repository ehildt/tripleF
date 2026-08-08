import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

import type { Exchange } from '@/stores/conversation';

const translate = vi.fn(
  (key: string, named?: Record<string, unknown>): string =>
    named && Object.keys(named).length
      ? `${key}[${JSON.stringify(named)}]`
      : key,
);

vi.mock('@/i18n/i18n', () => ({
  i18n: {
    global: {
      t: (...args: unknown[]) =>
        translate(
          args[0] as string,
          args[1] as Record<string, unknown> | undefined,
          args[2],
        ),
      locale: { value: 'en' },
      getLocaleMessage: () => ({ activity: {} }),
    },
  },
}));

vi.mock('@/i18n/locale-codes', () => ({
  isLocaleCode: () => true,
}));

vi.mock('@/i18n/messages', () => ({
  localeLoaders: { en: () => Promise.resolve({}) },
}));

import { useActivityLabel } from './use-activity-label';

function makeExchange(overrides: Partial<Exchange> = {}): Exchange {
  return {
    id: 'e1',
    role: 'assistant',
    content: '',
    status: 'pending',
    timestamp: 0,
    ...overrides,
  } as Exchange;
}

describe('useActivityLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    translate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('translates a single server step descriptor in the model language', async () => {
    const scope = effectScope();
    const activityLabel = scope.run(() => {
      const exchange = ref(
        makeExchange({
          activityLanguage: 'de',
          activity: { key: 'activity.searching' },
        }),
      );
      return useActivityLabel(exchange).activityLabel;
    });

    await nextTick();
    expect(activityLabel!.value).toBe('activity.searching');
    expect(translate).toHaveBeenCalledWith(
      'activity.searching',
      {},
      { locale: 'de' },
    );
    scope.stop();
  });

  it('shows the consolidating descriptor while reasoning streams', async () => {
    const scope = effectScope();
    const activityLabel = scope.run(() => {
      const exchange = ref(
        makeExchange({ reasoning: 'Thinking through the request' }),
      );
      return useActivityLabel(exchange).activityLabel;
    });

    await nextTick();
    expect(activityLabel!.value).toBe('activity.consolidating');
    scope.stop();
  });

  it('cycles through parallel tool categories one at a time, never chaining', async () => {
    const scope = effectScope();
    const activityLabel = scope.run(() => {
      const exchange = ref(
        makeExchange({
          toolCalls: [
            {
              name: 'webSearch',
              category: 'web',
              query: 'cars',
              status: 'start',
            },
            {
              name: 'imageSearch',
              category: 'images',
              query: 'cars',
              status: 'start',
            },
          ],
        }),
      );
      return useActivityLabel(exchange).activityLabel;
    });

    await nextTick();
    const first = activityLabel!.value;
    // Exactly one category shown, not a chained label.
    expect(first).toContain('activity.web');
    expect(first).toContain('activity.forQuery');
    expect(first).toContain('…');
    expect(first).not.toContain('activity.images');

    await vi.advanceTimersByTimeAsync(2000);
    await nextTick();
    expect(activityLabel!.value).toContain('activity.images');
    expect(activityLabel!.value).not.toContain('activity.web');

    await vi.advanceTimersByTimeAsync(2000);
    await nextTick();
    expect(activityLabel!.value).toContain('activity.web');
    expect(activityLabel!.value).not.toContain('activity.images');
    scope.stop();
  });
});
