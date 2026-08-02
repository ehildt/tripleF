import { type LanguageIdentifier, loadModule } from 'cld3-asm';

/**
 * Lazily load the CLD3 wasm model once per process. `create(0, 1000)` lowers
 * the default 140-byte minimum so short titles get predicted at all — the
 * reliability flag, not the raw guess, decides whether we trust a result.
 */
let identifierPromise: Promise<LanguageIdentifier> | undefined;

function getIdentifier(): Promise<LanguageIdentifier> {
  identifierPromise ??= loadModule().then((factory) => factory.create(0, 1000));
  return identifierPromise;
}

/**
 * Detect the BCP-47 base language of a short text (an article's title +
 * snippet, a video title, …). Returns undefined unless the prediction is
 * reliable — uncertain items keep flowing as user-language content instead
 * of being exiled to the international pool.
 */
export async function detectLanguage(
  text: string,
): Promise<string | undefined> {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const result = (await getIdentifier()).findLanguage(trimmed);
  if (!result.is_reliable) return undefined;
  // Script-qualified codes ('ja-Latn', 'ru-Latn') bucket by base language.
  return result.language.split('-')[0];
}
