/**
 * Boundary of the partition store/delete lane: what the filtered-record
 * delete reports back to its caller.
 */

/** Outcome of a filtered delete: `deleted` stays 0 when the match count exceeded the cap. */
export interface DeleteRecordsOutcome {
  /** Records actually removed. */
  deleted: number;
  /** Verbatim texts of the removed records — the caller confirms exactly what is gone. */
  texts: string[];
  /** Total matches found, including when refused (callers phrase the refusal). */
  matched: number;
}
