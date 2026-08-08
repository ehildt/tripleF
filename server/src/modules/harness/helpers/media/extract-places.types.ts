export interface ExtractedPlace {
  title: string;
  address: string;
  phoneNumber?: string;
  rating?: number;
  ratingCount?: number;
  type?: string;
  website?: string;
}

export type RawPlace = {
  title?: string;
  address?: string;
  phoneNumber?: string;
  rating?: number;
  ratingCount?: number;
  type?: string;
  website?: string;
};
