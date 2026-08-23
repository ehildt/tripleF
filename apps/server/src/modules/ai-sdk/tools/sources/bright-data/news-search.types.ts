interface BrightDataNewsItem {
  title: string;
  link: string;
  description: string;
  date: string;
  source: string;
  image_url?: string;
}

export interface BrightDataNewsSearchResponse {
  news?: BrightDataNewsItem[];
}
