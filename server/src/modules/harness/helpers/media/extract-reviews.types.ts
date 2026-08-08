export interface ExtractedReview {
  author: string;
  snippet: string;
  rating?: number;
  date?: string;
  place?: string;
}

export type RawReview = {
  author?: string;
  snippet?: string;
  rating?: number;
  date?: string;
  place?: string;
};
