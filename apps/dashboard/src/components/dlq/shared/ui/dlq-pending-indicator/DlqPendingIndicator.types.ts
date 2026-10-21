export interface DlqPendingIndicatorProps {
  /** Visual state of the loading bar — `default` pulses in the loading color,
   * `aborting` switches to the secondary loading color while a request is
   * being cancelled. */
  variant?: 'default' | 'aborting';
}
