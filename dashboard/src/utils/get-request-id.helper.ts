export function getRequestId(data: unknown): string | undefined {
  if (data && typeof data === 'object' && 'requestId' in data) {
    return (data as { requestId?: string }).requestId;
  }
  return undefined;
}
