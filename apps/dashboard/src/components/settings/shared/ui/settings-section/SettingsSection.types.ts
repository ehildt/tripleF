export interface SettingsSectionProps {
  /** Show the loading state instead of the section content. */
  loading?: boolean;
  /** Show the error state instead of the section content. */
  error?: boolean;
  /** Shown (instead of the section content) while `loading` is true. */
  loadingMessage?: string;
  /** Shown (instead of the section content) when `error` is true. */
  errorMessage?: string;
}
