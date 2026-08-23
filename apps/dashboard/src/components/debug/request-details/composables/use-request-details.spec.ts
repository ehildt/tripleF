import { describe, expect, it } from 'vitest';
import { computed, nextTick, ref } from 'vue';

import type { DebugResult } from '../../../../types/debug.model';
import { useRequestDetails } from './use-request-details';

const baseHttp: DebugResult = {
  id: '1',
  timestamp: '',
  endpoint: '/api/v1/harness?key=val',
  method: 'POST',
  status: 'success',
  responseTime: 42,
  type: 'http',
  direction: 'request',
};

describe('useRequestDetails', () => {
  it('returns no tabs and null token percent when result is null', () => {
    const result = computed<DebugResult | null>(() => null);
    const { tabs, tokenPercent, parsedEndpoint } = useRequestDetails(result);

    expect(tabs.value).toEqual([]);
    expect(tokenPercent.value).toBeNull();
    expect(parsedEndpoint.value.path).toBe('');
  });

  it('parses an HTTP endpoint into path and filtered params', () => {
    const result = computed<DebugResult | null>(() => ({
      ...baseHttp,
      endpoint: '/api/v1/harness?key=val&requestId=req-1',
    }));
    const { parsedEndpoint } = useRequestDetails(result);

    expect(parsedEndpoint.value.path).toBe('/api/v1/harness');
    expect(parsedEndpoint.value.params).toEqual([{ key: 'key', value: 'val' }]);
  });

  it('parses a socket endpoint into event and room', () => {
    const result = computed<DebugResult | null>(() => ({
      ...baseHttp,
      type: 'socket',
      endpoint: 'socket.io:harness:room-1:{}',
    }));
    const { parsedEndpoint } = useRequestDetails(result);

    expect(parsedEndpoint.value.path).toBeTruthy();
    expect(parsedEndpoint.value.event).toBe('harness');
    // The room is the third colon-delimited segment after stripping
    // "socket.io:". The original scheme encodes the body in slot 2
    // and the room in slot 3; this test pins the current behavior.
    expect(parsedEndpoint.value.room).toBe('{}');
  });

  it('builds the tab list from result fields', () => {
    const result = computed<DebugResult | null>(() => ({
      ...baseHttp,
      requestHeaders: { 'x-test': '1' },
      requestBody: '{"a":1}',
      responseBody: '{"b":2}',
    }));
    const { tabs } = useRequestDetails(result);

    const ids = tabs.value.map((t) => t.id);
    expect(ids).toContain('headers');
    expect(ids).toContain('body');
    expect(ids).toContain('response');
  });

  it('exposes a params tab only for non-socket results with filtered params', () => {
    const result = computed<DebugResult | null>(() => ({
      ...baseHttp,
      endpoint: '/api/v1/harness?foo=bar',
    }));
    const { tabs } = useRequestDetails(result);
    const params = tabs.value.find((t) => t.id === 'params');
    expect(params).toBeDefined();
    expect(params!.content as string).toContain('"foo"');
  });

  it('toggles the active tab on select', () => {
    const result = computed<DebugResult | null>(() => ({
      ...baseHttp,
      responseBody: '{}',
    }));
    const { activeTab, selectTab } = useRequestDetails(result);
    selectTab('response');
    expect(activeTab.value).toBe('response');
    selectTab('response');
    expect(activeTab.value).toBeNull();
  });

  it('resets the active tab when the result id changes', async () => {
    const r = ref<DebugResult | null>(null);
    const result = computed(() => r.value);
    const { activeTab } = useRequestDetails(result);
    expect(activeTab.value).toBeNull();

    // Reassign to a new result with a body
    r.value = { ...baseHttp, id: '1', requestBody: '{}' };
    await nextTick();
    // The endpoint has query params, so 'params' is the first tab,
    // followed by 'body'.
    expect(activeTab.value).toBe('params');
  });
});
