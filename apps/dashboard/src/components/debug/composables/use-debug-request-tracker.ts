import { buildFormDataSummary } from '@/components/debug/composables/helpers/build-form-data-summary.helper';
import { extractPrompt } from '@/components/debug/composables/helpers/extract-prompt.helper';
import { formatResponseBody } from '@/components/debug/composables/helpers/format-response-body.helper';
import { sanitizeRequestBody } from '@/components/debug/composables/helpers/sanitize-request-body.helper';
import { useDebugStore } from '@/stores/debug/debug.store';
import type { TrackRequestDetails } from '@/types/track-request-details.model';

interface DebugRequestTracker {
  trackRequest: (
    endpoint: string,
    method: string,
    promise: Promise<Response>,
    details?: TrackRequestDetails,
  ) => Promise<Response>;
}

/** Own response logging without consuming or wrapping the caller's request. */
export function useDebugRequestTracker(): DebugRequestTracker {
  const debugStore = useDebugStore();

  function trackRequest(
    endpoint: string,
    method: string,
    promise: Promise<Response>,
    details?: TrackRequestDetails,
  ): Promise<Response> {
    const startTime = performance.now();
    const prompt = extractPrompt(details?.formData, details?.body);
    const requestBody = details?.formData
      ? buildFormDataSummary(details.formData)
      : sanitizeRequestBody(details?.body);

    const tracking = promise.then(
      async (response) => {
        if (debugStore.debugPaused) return;
        const responseText = await response.clone().text();
        const responseBody = await formatResponseBody(responseText);
        const responseTime = Math.round(performance.now() - startTime);
        debugStore.addDebugResult({
          endpoint,
          method,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          errorMessage: response.ok
            ? undefined
            : `HTTP ${response.status}: ${responseBody.slice(0, 200)}`,
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
      },
      (error: unknown) => {
        debugStore.addDebugResult({
          endpoint,
          method,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
          responseTime: Math.round(performance.now() - startTime),
          type: 'http',
          requestHeaders: details?.headers,
          requestBody,
          prompt,
        });
      },
    );

    // Logging is detached from the caller's request. Clone/read/format or
    // append failures are diagnostic only and must never become unhandled
    // rejections or masquerade as network failures.
    void tracking.catch((error: unknown) => {
      console.error('Debug request tracking failed', error);
    });
    return promise;
  }

  return { trackRequest };
}
