import { isTrustedImageUrl } from '../../media/is-trusted-image-url.helper';
import { isVideoUrl } from '../../media/is-video-url.helper';
import { isMeaningfulString } from '../is-meaningful-string.helper';

type FilterArray = <T>(
  value: T[] | undefined,
  predicate: (item: T) => boolean,
) => T[] | undefined;

/** Clean one body section's hero and snippet lists. */
export function mapBodySectionWithCleanedHero<
  T extends {
    heroImageUrl?: string;
    heroImageAlt?: string;
    heroCaption?: string;
    heroVideoUrl?: string;
    heroVideoTitle?: string;
    heroVideoCaption?: string;
    strengths?: Array<{ text?: string }>;
    weaknesses?: Array<{ text?: string }>;
    recommendations?: Array<{ text?: string }>;
  },
>(section: T, filterArray: FilterArray) {
  const heroImageUrl =
    section.heroImageUrl && isTrustedImageUrl(section.heroImageUrl)
      ? section.heroImageUrl
      : undefined;
  let heroVideoUrl = section.heroVideoUrl;
  if (heroVideoUrl && !isVideoUrl(heroVideoUrl)) heroVideoUrl = undefined;
  if (heroVideoUrl && !section.heroVideoTitle?.trim()) {
    heroVideoUrl = undefined;
  }
  return {
    ...section,
    heroImageUrl,
    heroImageAlt: heroImageUrl ? section.heroImageAlt : undefined,
    heroCaption: heroImageUrl ? section.heroCaption : undefined,
    heroVideoUrl,
    heroVideoTitle: heroVideoUrl ? section.heroVideoTitle : undefined,
    heroVideoCaption: heroVideoUrl ? section.heroVideoCaption : undefined,
    strengths: filterArray(section.strengths, (item) =>
      isMeaningfulString(item.text),
    ),
    weaknesses: filterArray(section.weaknesses, (item) =>
      isMeaningfulString(item.text),
    ),
    recommendations: filterArray(section.recommendations, (item) =>
      isMeaningfulString(item.text),
    ),
  };
}
