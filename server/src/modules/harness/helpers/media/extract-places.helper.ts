import type { ExtractedPlace, RawPlace } from './extract-places.types.js';
import type { ToolEntry } from './tool-entry.types.js';

const MAX_PLACES = 10;

function readResults(result: unknown): RawPlace[] {
  const results = (result as { results?: RawPlace[] } | undefined)?.results;
  return Array.isArray(results) ? results : [];
}

function toPlace(raw: RawPlace): ExtractedPlace {
  return {
    title: raw.title || '',
    address: raw.address || '',
    ...(raw.phoneNumber ? { phoneNumber: raw.phoneNumber } : {}),
    ...(typeof raw.rating === 'number' ? { rating: raw.rating } : {}),
    ...(typeof raw.ratingCount === 'number'
      ? { ratingCount: raw.ratingCount }
      : {}),
    ...(raw.type ? { type: raw.type } : {}),
    ...(raw.website ? { website: raw.website } : {}),
  };
}

/**
 * Extract local business entries from *PlacesSearch tool results as compact,
 * labeled records for the respond step's tool context. Templates use them as
 * factual context (e.g. local availability in a product buy advice).
 */
export function extractPlaces(toolResults: ToolEntry[]): ExtractedPlace[] {
  const seen = new Set<string>();

  return toolResults
    .filter((tr) => tr.toolName.endsWith('PlacesSearch'))
    .flatMap((tr) => readResults(tr.result))
    .filter((raw) => {
      if (!raw.title) return false;
      const key = `${raw.title}:${raw.address ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_PLACES)
    .map(toPlace);
}
