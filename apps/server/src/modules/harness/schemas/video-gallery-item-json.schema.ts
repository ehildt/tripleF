import { z } from 'zod';

import {
  safeMediaUrlOrEmpty,
  safeVideoUrl,
} from '../helpers/url-trust/url-schema.helper.js';

/**
 * One entry of a videoGalleryItems array — shared by every template with a
 * video surface (article, news, summary, evaluation, product, videolist).
 *
 * title and caption are enforced (not optional) because the playlist panel,
 * the video popout title bar, and the now-playing marquee all display them.
 * duration/channel/date/views/thumbnailUrl/description are optional
 * carry-overs from the video search tool results.
 */
export const videoGalleryItemSchema = z.object(
  {
    videoUrl: safeVideoUrl({
      message: 'videoGalleryItems.videoUrl must be a valid URL',
    }),
    title: z.string().min(1, {
      message: 'videoGalleryItems.title must not be empty',
    }),
    caption: z.string().min(1, {
      message: 'videoGalleryItems.caption must not be empty',
    }),
    duration: z.string().optional(),
    channel: z.string().optional(),
    date: z.string().optional(),
    views: z.number().int().min(0).optional(),
    thumbnailUrl: safeMediaUrlOrEmpty({
      message: 'videoGalleryItems.thumbnailUrl must be a valid URL',
    }),
    description: z.string().optional(),
  },
  { message: 'videoGalleryItems entries must be objects with videoUrl' },
);

type HeroVideoData = {
  heroVideoUrl?: string;
  heroVideoTitle?: string;
};

/**
 * Cross-field rule for the hero video: the hero popout title bar, the hero
 * playlist entry, and the now-playing marquee all read heroVideoTitle, so a
 * hero video without a title must not validate. Empty heroVideoUrl (or no
 * hero video at all) keeps the title optional.
 */
export function heroVideoHasTitle(data: HeroVideoData): boolean {
  return !data.heroVideoUrl?.trim() || Boolean(data.heroVideoTitle?.trim());
}

export const HERO_VIDEO_TITLE_ISSUE: { message: string; path: string[] } = {
  message: 'heroVideoTitle must not be empty when heroVideoUrl is set',
  path: ['heroVideoTitle'],
};
