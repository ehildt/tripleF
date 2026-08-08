import type { MetaEntry } from './build-filenames.helper.types.js';

export function buildFilenames(
  processedMeta: MetaEntry[],
  variantDescriptions?: string[],
): string {
  if (!variantDescriptions) {
    return processedMeta
      .map(({ name, hash }, index) => `${index + 1}. ${name} (hash: ${hash})`)
      .join('\n');
  }

  const groups = new Map<string, { meta: MetaEntry; description: string }[]>();
  for (let i = 0; i < processedMeta.length; i++) {
    const m = processedMeta[i];
    const suffix = m.variant ? `_${m.variant}` : '';
    const key =
      suffix && m.hash.endsWith(suffix)
        ? m.hash.slice(0, -suffix.length)
        : m.hash;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ meta: m, description: variantDescriptions[i] });
  }

  return [...groups.entries()]
    .map(([, entries], groupIndex) => {
      const first = entries[0].meta;
      const dot = first.name.lastIndexOf('.');
      const base = dot > 0 ? first.name.substring(0, dot) : first.name;
      const ext = dot > 0 ? first.name.substring(dot) : '';
      const suf = first.variant ? `_${first.variant}` : '';
      const origName =
        suf && base.endsWith(suf)
          ? base.slice(0, -suf.length) + ext
          : first.name;
      const origHash =
        suf && first.hash.endsWith(suf)
          ? first.hash.slice(0, -suf.length)
          : first.hash;
      const header = `${groupIndex + 1}. ${origName} (hash: ${origHash})`;
      const lines = entries.map(
        (e) => `  ${e.meta.variant ?? 'original'}: ${e.description}`,
      );
      return [header, ...lines].join('\n');
    })
    .join('\n\n');
}
