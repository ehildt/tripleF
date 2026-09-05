/**
 * The merge winner of one label pair: more leaves first (the label more
 * records already point at), the older row on a tie (the established label
 * wins — churn stays minimal), then lexical for full determinism.
 */
export function pickMergeWinner<
  T extends { createdAt: Date; name: string },
>(params: { a: T; b: T; countA: number; countB: number }): T {
  if (params.countA !== params.countB) {
    return params.countA > params.countB ? params.a : params.b;
  }
  if (params.a.createdAt.getTime() !== params.b.createdAt.getTime()) {
    return params.a.createdAt <= params.b.createdAt ? params.a : params.b;
  }
  return params.a.name <= params.b.name ? params.a : params.b;
}
