import type { ResolvableOffer } from './serper-shop-links.types.js';

/** Replace an offer's Google link with its resolved merchant URL, if any. */
export function applyResolvedMerchantUrl<T extends ResolvableOffer>(
  offer: T,
  merchantUrlByLink: Map<string, string>,
): T {
  return merchantUrlByLink.has(offer.link) ? { ...offer, link: merchantUrlByLink.get(offer.link)! } : offer;
}
