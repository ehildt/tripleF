import type { ToolLogger } from '../types/types.js';

import { applyResolvedMerchantUrl } from './apply-resolved-merchant-url.helper.js';
import { isGoogleHostUrl } from './is-google-host-url.helper.js';
import { resolveOfferMerchantUrl } from './resolve-offer-merchant-url.helper.js';
import type { ResolvableOffer } from './serper-shop-links.types.js';

/** Cap parallel resolution look-ups independent of the configured result count. */
const MAX_LINK_RESOLUTIONS = 12;

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
  deps: { apiKey: string; lang?: string; logger: ToolLogger },
): Promise<T[]> {
  const googleLinked = offers.filter((offer) => offer.link && isGoogleHostUrl(offer.link));
  if (googleLinked.length === 0) return offers;

  const resolvable = googleLinked.slice(0, MAX_LINK_RESOLUTIONS);
  const resolutions = await Promise.all(resolvable.map((offer) => resolveOfferMerchantUrl(offer, deps)));

  const merchantUrlByLink = new Map<string, string>();
  for (const { offer, merchantUrl } of resolutions) {
    if (merchantUrl) merchantUrlByLink.set(offer.link, merchantUrl);
  }
  if (merchantUrlByLink.size === 0) return offers;

  deps.logger.log(`Resolved ${merchantUrlByLink.size}/${googleLinked.length} Google shop link(s) to merchant URLs`);

  return offers.map((offer) => applyResolvedMerchantUrl(offer, merchantUrlByLink));
}
