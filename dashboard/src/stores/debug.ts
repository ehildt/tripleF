import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { extractPrompt } from '@/utils/extract-prompt.helper';

import { useReadTracker } from '../composables/use-read-tracker';
import type { DebugResult } from '../types/debug.model';
import type { TrackRequestDetails } from '../types/track-request-details.model';
import { createId } from '../utils/id.helper';
import { buildFormDataSummary } from './helpers/build-form-data-summary.helper';
import { createTrackingPromise } from './helpers/create-tracking-promise.helper';
import { formatResponseBody } from './helpers/format-response-body.helper';
import { sanitizeRequestBody } from './helpers/sanitize-request-body.helper';

type DebugResultInput = Omit<DebugResult, 'id' | 'timestamp' | 'direction'>;

export const useDebugStore = defineStore('debug', () => {
  const debugResults = ref<DebugResult[]>([]);
  const selectedDebugResult = ref<DebugResult | null>(null);
  const readTracker = useReadTracker('read-debug-ids');
  const lastSeenDebugCount = ref(0);
  const debugTabVisited = ref(false);
  const debugPaused = ref(localStorage.getItem('debug-paused') === 'true');

  watch(debugPaused, (v) => {
    localStorage.setItem('debug-paused', String(v));
  });

  function markDebugAsRead(id: string) {
    readTracker.markAsRead(id);
  }

  const debugLogCount = computed(() => {
    const liveIds = debugResults.value.map((r) => r.id).filter(Boolean);
    return readTracker.unreadCount(liveIds);
  });

  function isDebugRead(id: string) {
    return readTracker.isRead(id);
  }

  function toggleDebugPaused() {
    debugPaused.value = !debugPaused.value;
  }

  function addDebugResult(result: DebugResultInput) {
    if (debugPaused.value) return;
    debugResults.value.unshift({
      id: createId(),
      timestamp: new Date().toLocaleTimeString(),
      direction: 'request',
      ...result,
      epoch: Date.now(),
    } as DebugResult);
  }

  function addSocketDebugEntry(result: {
    endpoint: string;
    method: string;
    status: 'success' | 'error';
    statusCode?: number;
    errorMessage?: string;
    responseTime: number;
    type: 'http' | 'socket';
    direction: 'request' | 'response';
    requestId?: string;
    roomId?: string;
    event?: string;
    stream?: boolean;
    conversationId?: string;
  }) {
    if (debugPaused.value) return;
    debugResults.value.unshift({
      id: createId(),
      timestamp: new Date().toLocaleTimeString(),
      ...result,
      epoch: Date.now(),
    } as DebugResult);
  }

  function trackRequest(
    endpoint: string,
    method: string,
    promise: Promise<Response>,
    details?: TrackRequestDetails,
  ) {
    const tracking = createTrackingPromise(promise);
    const prompt = extractPrompt(details?.formData, details?.body);
    const requestBody = details?.formData
      ? buildFormDataSummary(details.formData)
      : sanitizeRequestBody(details?.body);

    tracking.promise
      .then(async (res) => {
        const { responseTime, responseBody } = await (async () => {
          const time = Math.round(performance.now() - tracking.startTime);
          const text = await res.clone().text();
          const body = await formatResponseBody(text);
          return { responseTime: time, responseBody: body };
        })();

        addDebugResult({
          endpoint,
          method,
          status: res.ok ? 'success' : 'error',
          statusCode: res.status,
          errorMessage: res.ok
            ? undefined
            : `HTTP ${res.status}: ${responseBody.slice(0, 200)}`,
          responseTime,
          type: 'http',
          requestHeaders: details?.headers,
          requestBody,
          responseBody,
          requestId: details?.requestId,
          roomId: details?.roomId,
          event: details?.event,
          numCtx: details?.numCtx,
          stream: details?.stream,
          model: details?.model,
          prompt,
        });
        return res;
      })
      .catch((err) => {
        const responseTime = Math.round(performance.now() - tracking.startTime);
        addDebugResult({
          endpoint,
          method,
          status: 'error',
          errorMessage: err instanceof Error ? err.message : String(err),
          responseTime,
          type: 'http',
          requestHeaders: details?.headers,
          requestBody,
          prompt,
        });
        throw err;
      });

    return promise;
  }

  function clearDebugResults() {
    debugResults.value = [];
    lastSeenDebugCount.value = 0;
    selectedDebugResult.value = null;
  }

  function incrementDebugCount(newCount: number) {
    if (newCount > lastSeenDebugCount.value) {
      lastSeenDebugCount.value = newCount;
    }
  }

  function resetDebugCount() {
    lastSeenDebugCount.value = debugResults.value.length;
  }

  return {
    debugResults,
    selectedDebugResult,
    debugLogCount,
    lastSeenDebugCount,
    debugTabVisited,
    debugPaused,
    toggleDebugPaused,
    addDebugResult,
    addSocketDebugEntry,
    trackRequest,
    clearDebugResults,
    incrementDebugCount,
    resetDebugCount,
    markDebugAsRead,
    isDebugRead,
  };
});
