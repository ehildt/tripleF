interface SerperImageItem {
  title?: string;
  imageUrl?: string;
  image?: string;
  link?: string;
  imageWidth?: number;
  imageHeight?: number;
  width?: number;
  height?: number;
  source?: string;
  domain?: string;
}

export interface SerperImageSearchResponse {
  images?: SerperImageItem[];
}
