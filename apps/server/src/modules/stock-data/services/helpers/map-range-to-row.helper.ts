/** Convert a coverage range into a ledger row for the given ticker. */
export function mapRangeToRow(r: { from: string; to: string }, ticker: string) {
  return {
    ticker,
    fromDate: new Date(`${r.from}T00:00:00Z`),
    toDate: new Date(`${r.to}T00:00:00Z`),
  };
}
