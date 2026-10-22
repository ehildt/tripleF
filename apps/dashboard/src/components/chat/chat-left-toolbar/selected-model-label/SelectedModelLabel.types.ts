export interface SelectedModelLabelProps {
  /** Displayed model name (the active conversation's or the global selection); empty renders the "please select a model" placeholder. */
  selectedModelName: string;
  /** Whether the selected model is missing from the fetched catalog. */
  isModelMissing: boolean;
}
