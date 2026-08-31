/** Project a locale into the option shape. */
export function mapLocaleToOption(l: {
  code: string;
  name: string;
  countryCode: string;
}) {
  return { code: l.code, name: l.name, flag: l.countryCode };
}
