import { detectLanguage } from './detect-language.helper.js';

/**
 * Fill the `lang` of every item whose language is still unknown, using CLD3
 * detection over caller-chosen text. Upstream-provided flags win (`??=`).
 */
export async function tagLanguage<T extends { lang?: string }>(
  items: T[],
  pickText: (item: T) => string,
): Promise<void> {
  await Promise.all(
    items.map(async (item) => {
      item.lang ??= await detectLanguage(pickText(item));
    }),
  );
}
