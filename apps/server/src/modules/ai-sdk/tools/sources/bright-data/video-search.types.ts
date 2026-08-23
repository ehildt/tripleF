interface BrightDataVideoItem {
  title?: string;
  link?: string;
  description?: string;
  duration?: string;
  image?: string;
}

export interface BrightDataVideoSearchResponse {
  organic?: BrightDataVideoItem[];
}
