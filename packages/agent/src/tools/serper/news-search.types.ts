interface SerperNewsItem {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  imageUrl?: string;
}

export interface SerperNewsSearchResponse {
  news?: SerperNewsItem[];
}
