/**
 * A price formatter: currency-aware when a currency is given, else two
 * decimals. The Intl formatter is created once per currency.
 */
export function buildPriceFormatter(
  currency?: string,
): (price: number) => string {
  if (currency) {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    });
    return (price) => formatter.format(price);
  }
  return (price) => price.toFixed(2);
}
