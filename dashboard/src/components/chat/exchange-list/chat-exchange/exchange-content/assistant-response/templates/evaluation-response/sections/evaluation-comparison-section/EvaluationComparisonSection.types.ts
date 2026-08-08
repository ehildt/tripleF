/** A matrix column: one evaluated subject. */
export interface EvaluationComparisonColumn {
  /** Subject name (column header). */
  name: string;
  /** Whether this subject is the declared winner. */
  winner: boolean;
}

/** A matrix cell: one subject's formatted score for the row's criterion. */
export interface EvaluationComparisonCell {
  /** Column subject the cell belongs to. */
  column: string;
  /** Display text — the score or an em dash when unscored. */
  text: string;
  /** Whether the column subject is the declared winner. */
  winner: boolean;
}

/** A matrix row: one criterion with one cell per column. */
export interface EvaluationComparisonRow {
  /** Criterion name (row header). */
  name: string;
  /** Cells aligned with the columns order. */
  cells: EvaluationComparisonCell[];
}

export interface EvaluationComparisonSectionProps {
  /** Section title — "Comparison" for multi-subject evaluations, or
   * "Verdict" for single-subject critiques. Resolved by the orchestrator. */
  title: string;
  /** Narrative head-to-head summary. */
  summary?: string;
  /** Overall verdict text. */
  verdict?: string;
  /** Declared winner's name, when one clearly leads. */
  winner?: string;
  /** Matrix columns (evaluated subjects). */
  columns: EvaluationComparisonColumn[];
  /** Matrix rows (scored criteria). */
  rows: EvaluationComparisonRow[];
}
