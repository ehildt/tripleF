export function NumCtxConfigAdapter(env = process.env): number[] {
  const raw = env.NUM_CTX;
  if (!raw)
    return [4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576];
  return raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);
}
