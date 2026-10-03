import { Images } from '@lucide/vue';
import { describe, expect, it } from 'vitest';

import type { MediaPresentations } from '@/types/harness-response-data.model';

import { mapPresentationToggle } from './map-presentation-toggle.helper';

const config = { key: 'gallery', media: 'image', icon: Images } as const;

const switchKeys = {
  image: {
    toGallery: 'common.switchToImageGallery',
    toList: 'common.switchToImageList',
  },
  video: {
    toGallery: 'common.switchToVideoGallery',
    toList: 'common.switchToVideoList',
  },
};

describe('mapPresentationToggle', () => {
  it('picks the list switch key when the media is presented as a gallery', () => {
    const mediaPresentations: MediaPresentations = {
      image: 'gallery',
      video: 'gallery',
    };
    expect(
      mapPresentationToggle(config, mediaPresentations, switchKeys),
    ).toEqual({
      key: 'gallery',
      media: 'image',
      icon: Images,
      presentation: 'gallery',
      titleKey: 'common.switchToImageList',
    });
  });

  it('picks the gallery switch key when the media is presented as a list', () => {
    const mediaPresentations: MediaPresentations = {
      image: 'list',
      video: 'gallery',
    };
    expect(
      mapPresentationToggle(config, mediaPresentations, switchKeys),
    ).toEqual({
      key: 'gallery',
      media: 'image',
      icon: Images,
      presentation: 'list',
      titleKey: 'common.switchToImageGallery',
    });
  });
});
