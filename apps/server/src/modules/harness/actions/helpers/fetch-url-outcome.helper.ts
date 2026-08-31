/** Fetch one URL through the webFetch tool, capturing the outcome. */
export async function fetchUrlOutcome(
  url: string,
  execute: (args: { url: string }) => Promise<unknown>,
): Promise<{ url: string; result?: unknown; error?: Error }> {
  try {
    const result = await execute({ url });
    return { url, result };
  } catch (err) {
    return {
      url,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
