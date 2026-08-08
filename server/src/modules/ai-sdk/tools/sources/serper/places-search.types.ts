interface SerperPlaceItem {
  title: string;
  address: string;
  phoneNumber?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  ratingCount?: number;
  type?: string;
  website?: string;
  cid?: string;
}

export interface SerperPlacesSearchResponse {
  places?: SerperPlaceItem[];
}
