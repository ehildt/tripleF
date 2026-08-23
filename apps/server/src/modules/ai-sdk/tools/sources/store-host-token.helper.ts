/** Legal-form and TLD/host labels carry no merchant identity for host matching. */
const NON_IDENTITY_TOKENS = new Set([
  // company/legal forms
  'gmbh',
  'ag',
  'se',
  'kg',
  'ohg',
  'ug',
  'ltd',
  'inc',
  'llc',
  'sarl',
  'sa',
  'bv',
  'oy',
  'ab',
  'as',
  'spa',
  'srl',
  'pte',
  'pty',
  // tld and host labels
  'com',
  'de',
  'at',
  'ch',
  'co',
  'uk',
  'net',
  'org',
  'io',
  'eu',
  'fr',
  'nl',
  'it',
  'es',
  'pl',
  'no',
  'fi',
  'dk',
  'us',
  'ca',
  'au',
  'nz',
  'jp',
  'kr',
  'cn',
  'in',
  'br',
  'mx',
  'ru',
  'be',
  'ie',
  'cz',
  'gr',
  'pt',
  'hu',
  'ro',
  'shop',
  'store',
  'online',
]);

/**
 * Normalize a merchant name from Google Shopping ("MediaMarkt", "Amazon.de",
 * "notebooksbilliger.de", "Scan Computers") into a lowercase host-comparable
 * token ("mediamarkt", "amazon", "notebooksbilliger", "scancomputers").
 * Legal-form and TLD tokens are dropped so the token matches the merchant's
 * domain label rather than its full legal or dotted name.
 */
export function storeHostToken(source: string): string {
  return source
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0 && !NON_IDENTITY_TOKENS.has(token))
    .join('');
}
