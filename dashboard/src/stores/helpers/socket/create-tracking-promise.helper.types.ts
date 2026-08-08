export interface TrackingPromise {
  promise: Promise<Response>;
  startTime: number;
}
