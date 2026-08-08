interface YoutubeSearchResponseItem {
  id?: { kind?: string; videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
}

export interface YoutubeSearchResponse {
  items?: YoutubeSearchResponseItem[];
}

interface YoutubeVideosResponseItem {
  id?: string;
  statistics?: { viewCount?: string };
  contentDetails?: { duration?: string };
  snippet?: { defaultLanguage?: string; defaultAudioLanguage?: string };
}

export interface YoutubeVideosResponse {
  items?: YoutubeVideosResponseItem[];
}

export interface VideoStats {
  viewCount: number;
  duration?: string;
  lang?: string;
}
