export interface SelectedModelLabelProps {
  /** Displayed model name (the active conversation's or the global selection); empty renders a dash. */
  selectedModelName: string;
  /** Whether the selected model is missing from the fetched catalog. */
  isModelMissing: boolean;
}
