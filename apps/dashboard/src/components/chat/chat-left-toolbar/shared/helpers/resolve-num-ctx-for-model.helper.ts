/** The numCtx value to persist after a model change, plus whether it clamped. */
type NumCtxResolution = {
  /** numCtx option to persist, or null when the conversation's value stays. */
  numCtx: string | null;
  /** True when the conversation's value exceeded the model's context window. */
  wasClamped: boolean;
};

/**
 * Decide the conversation's numCtx after the selected model changes. A value
 * above the model's context window clamps to the model's largest supported
 * option; otherwise the largest option is applied, and a missing max option
 * leaves the conversation untouched.
 */
export function resolveNumCtxForModel(
  currentNumCtx: number,
  contextLength: number,
  maxNumCtxOption: string,
): NumCtxResolution {
  if (currentNumCtx > contextLength) {
    return { numCtx: maxNumCtxOption, wasClamped: true };
  }
  if (maxNumCtxOption) {
    return { numCtx: maxNumCtxOption, wasClamped: false };
  }
  return { numCtx: null, wasClamped: false };
}
