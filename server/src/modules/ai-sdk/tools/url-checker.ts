export async function filterLiveUrls(
  urls: string[],
  timeoutMs = 1000,
): Promise<{ live: Set<string>; dead: Set<string> }> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return { live: new Set(), dead: new Set() };

  const results = await Promise.allSettled(
    unique.map(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (res.ok) return { url, live: true };
      } catch {
        /* unreachable / timeout */
      }
      return { url, live: false };
    }),
  );

  const live = new Set<string>();
  const dead = new Set<string>();
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    if (r.value.live) live.add(r.value.url);
    else dead.add(r.value.url);
  }
  return { live, dead };
}
