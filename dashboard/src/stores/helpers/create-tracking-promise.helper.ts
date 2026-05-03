export interface TrackingPromise {
  promise: Promise<Response>;
  startTime: number;
}

export function createTrackingPromise(
  promise: Promise<Response>,
): TrackingPromise {
  return { promise, startTime: performance.now() };
}
