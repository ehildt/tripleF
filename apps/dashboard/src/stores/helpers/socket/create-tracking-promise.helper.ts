import type { TrackingPromise } from './create-tracking-promise.helper.types';

export function createTrackingPromise(
  promise: Promise<Response>,
): TrackingPromise {
  return { promise, startTime: performance.now() };
}
