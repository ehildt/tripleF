import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';

import { applyLocaleParams } from './apply-locale-params.helper.js';
import { fetchWithTimeout } from './fetch-with-timeout.js';
import { mapOrganicEntryToUrl } from './map-organic-entry-to-url.helper.js';
import { pickMerchantResult } from './pick-merchant-result.helper.js';
import type { ResolvableOffer } from './serper-shop-links.types.js';
import { storeHostToken } from './store-host-token.helper.js';

const SERPER_SEARCH_URL = 'https://google.serper.dev/search';
const RESOLUTION_RESULT_COUNT = 3;

/** One Serper web search for "{product title} {merchant}" → merchant product URL. */
async function fetchMerchantUrl(
  offer: ResolvableOffer,
  deps: { apiKey: string; lang?: string },
): Promise<string | undefined> {
  const token = storeHostToken(offer.source ?? '');
  if (!token || !offer.title) return undefined;

  try {
    const body: Record<string, unknown> = {
      q: `${offer.title} ${offer.source}`,
      num: RESOLUTION_RESULT_COUNT,
    };
    applyLocaleParams(body, deps.lang);

    const res = await fetchWithTimeout(
      SERPER_SEARCH_URL,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': deps.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      { timeoutMs: SEARCH_TIMEOUT_MS },
    );
    if (!res.ok) return undefined;

    const data = (await res.json()) as {
      organic?: Array<{ link?: string }>;
    };
    return pickMerchantResult((data.organic ?? []).map(mapOrganicEntryToUrl), token);
  } catch {
    return undefined;
  }
}

/** Resolve an offer's merchant URL and pair it with the offer. */
export async function resolveOfferMerchantUrl(
  offer: ResolvableOffer,
  deps: { apiKey: string; lang?: string },
): Promise<{ offer: ResolvableOffer; merchantUrl: string | undefined }> {
  return {
    offer,
    merchantUrl: await fetchMerchantUrl(offer, deps),
  };
}
