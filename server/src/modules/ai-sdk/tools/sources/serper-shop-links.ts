import type { Logger } from '@nestjs/common';

import { applyLocaleParams } from './apply-locale-params.helper.js';
import { fetchWithTimeout } from './fetch-with-timeout.js';
import { isGoogleHostUrl } from './is-google-host-url.helper.js';
import { pickMerchantResult } from './pick-merchant-result.helper.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import type { ResolvableOffer } from './serper-shop-links.types.js';
import { storeHostToken } from './store-host-token.helper.js';

const SERPER_SEARCH_URL = 'https://google.serper.dev/search';

/** Cap parallel resolution look-ups independent of the configured result count. */
const MAX_LINK_RESOLUTIONS = 12;
const RESOLUTION_RESULT_COUNT = 3;

/**
 * Serper-specific shop-offer link resolution. Google Shopping returns
 * Google-hosted links (`google.com/search?ibp=oshop…`), never merchant URLs,
 * so each Google-linked offer is followed up with one Serper web search for
 * "{product title} {merchant}" and the merchant's own product page (the
 * first host-matching organic result) replaces the Google link. Offers that
 * cannot be resolved keep their original link.
 *
 * Kept inside the Serper tool layer on purpose: other search engines may
 * resolve merchant links differently — or already return them.
 */
export async function resolveSerperShopOfferLinks<T extends ResolvableOffer>(
  offers: T[],
  deps: { apiKey: string; lang?: string; logger: Logger },
): Promise<T[]> {
  const googleLinked = offers.filter(
    (offer) => offer.link && isGoogleHostUrl(offer.link),
  );
  if (googleLinked.length === 0) return offers;

  const resolvable = googleLinked.slice(0, MAX_LINK_RESOLUTIONS);
  const resolutions = await Promise.all(
    resolvable.map(async (offer) => ({
      offer,
      merchantUrl: await fetchMerchantUrl(offer, deps),
    })),
  );

  const merchantUrlByLink = new Map<string, string>();
  for (const { offer, merchantUrl } of resolutions) {
    if (merchantUrl) merchantUrlByLink.set(offer.link, merchantUrl);
  }
  if (merchantUrlByLink.size === 0) return offers;

  deps.logger.log(
    `Resolved ${merchantUrlByLink.size}/${googleLinked.length} Google shop link(s) to merchant URLs`,
  );

  return offers.map((offer) =>
    merchantUrlByLink.has(offer.link)
      ? { ...offer, link: merchantUrlByLink.get(offer.link)! }
      : offer,
  );
}

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
    return pickMerchantResult(
      (data.organic ?? []).map((entry) => ({ url: entry.link })),
      token,
    );
  } catch {
    return undefined;
  }
}
