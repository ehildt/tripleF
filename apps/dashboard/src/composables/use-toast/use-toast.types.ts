export interface ToastOptions {
  /** Auto-hide duration override in milliseconds. */
  duration?: number;
  /** Message-kind identity (see toast-keys.ts); muted keys never toast. */
  key?: string;
}
