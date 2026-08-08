interface SerperReviewAuthor {
  name?: string;
}

interface SerperReviewItem {
  snippet?: string;
  rating?: number;
  date?: string;
  isoDate?: string;
  likes?: number | null;
  user?: SerperReviewAuthor;
}

interface SerperPlaceInfo {
  title?: string;
  address?: string;
  rating?: number;
  ratingCount?: number;
}

export interface SerperBusinessReviewsSearchResponse {
  placeInfo?: SerperPlaceInfo;
  reviews?: SerperReviewItem[];
}
