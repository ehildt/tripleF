interface BrightDataPlaceItem {
  title?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviews_cnt?: number;
  type?: string;
  website?: string;
}

export interface BrightDataPlacesSearchResponse {
  local_results?: BrightDataPlaceItem[];
  places?: BrightDataPlaceItem[];
}
