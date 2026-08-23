import type { OembedProvider } from './oembed-provider.helper.types.js';

export const OEMBED_ENDPOINTS: Record<OembedProvider, string> = {
  youtube: 'https://www.youtube.com/oembed',
  vimeo: 'https://vimeo.com/api/oembed.json',
  dailymotion: 'https://www.dailymotion.com/services/oembed',
};

export const OEMBED_HOST_PROVIDERS: Record<string, OembedProvider> = {
  'youtube.com': 'youtube',
  'www.youtube.com': 'youtube',
  'm.youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'youtube-nocookie.com': 'youtube',
  'www.youtube-nocookie.com': 'youtube',
  'vimeo.com': 'vimeo',
  'www.vimeo.com': 'vimeo',
  'player.vimeo.com': 'vimeo',
  'dailymotion.com': 'dailymotion',
  'www.dailymotion.com': 'dailymotion',
  'dai.ly': 'dailymotion',
};

/** Whether a URL points at a known oEmbed provider host (not a direct file). */
export function hasOembedProvider(url: string): boolean {
  try {
    return (
      OEMBED_HOST_PROVIDERS[new URL(url).hostname.toLowerCase()] !== undefined
    );
  } catch {
    return false;
  }
}
