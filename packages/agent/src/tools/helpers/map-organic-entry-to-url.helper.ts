type OrganicEntry = { link?: string };

/**
 * Convert a Serper organic entry into the `{ url }` shape that
 * `pickMerchantResult` expects.
 */
export function mapOrganicEntryToUrl(entry: OrganicEntry) {
  return { url: entry.link };
}
