interface BrightDataOrganicResult {
  title: string;
  link: string;
  description: string;
}

export interface BrightDataWebSearchResponse {
  organic?: BrightDataOrganicResult[];
}
