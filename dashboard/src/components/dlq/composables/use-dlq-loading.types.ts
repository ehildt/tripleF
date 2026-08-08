export interface DlqLoadingOptions {
  refetch: () => Promise<unknown>;
  minLoadingMs?: number;
}
