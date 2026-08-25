interface BrightDataShoppingItem {
  title?: string;
  link?: string;
  price?: string;
  source?: string;
  image_url?: string;
  image?: string;
  delivery?: string;
  rating?: number;
  rating_count?: number;
}

export interface BrightDataShoppingSearchResponse {
  shopping?: BrightDataShoppingItem[];
}
