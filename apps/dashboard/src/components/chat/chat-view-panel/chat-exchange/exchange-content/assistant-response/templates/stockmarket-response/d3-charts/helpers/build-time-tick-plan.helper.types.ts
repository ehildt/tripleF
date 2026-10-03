/** One time-axis tick. */
export interface TimeTick {
  /** ISO time string of the tick. */
  time: string;
  /** Label text. */
  text: string;
  /** Whether this tick is a major line (strong grid style). */
  isMajor: boolean;
}

/** The calendar bucket a tick aligns to. */
export type TickAlign = 'month' | 'week' | 'day' | 'hour' | 'minute';

/** One tick interval: the step size and its calendar alignment. */
export interface TickInterval {
  stepMs: number;
  align: TickAlign;
}
