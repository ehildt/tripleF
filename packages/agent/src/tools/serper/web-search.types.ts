interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
}

export interface SerperWebSearchResponse {
  organic?: SerperOrganicResult[];
}
