interface SerperShoppingItem {
  title: string;
  link: string;
  price: string;
  source: string;
  imageUrl?: string;
  delivery?: string;
  rating?: number;
  ratingCount?: number;
}

export interface SerperShoppingSearchResponse {
  shopping?: SerperShoppingItem[];
}
