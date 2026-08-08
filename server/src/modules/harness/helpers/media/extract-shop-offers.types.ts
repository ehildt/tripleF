export interface ExtractedShopOffer {
  title: string;
  price: string;
  source: string;
  link: string;
  delivery?: string;
  rating?: number;
  ratingCount?: number;
}

export type RawShopOffer = {
  title?: string;
  price?: string;
  source?: string;
  link?: string;
  delivery?: string;
  rating?: number;
  ratingCount?: number;
};
