interface SerperVideoItem {
  title: string;
  link: string;
  snippet: string;
  channel: string;
  duration: string;
  date: string;
  imageUrl: string;
  source?: string;
  views: number;
}

export interface SerperVideoSearchResponse {
  videos?: SerperVideoItem[];
}
