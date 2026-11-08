import type {
  CollapsedSections,
  MediaPresentations,
} from '../../../types/assistant-response-data.model';

export const MEDIA_PRIORITY_KEY = 'harness-media-priority';
export const CONVERSATION_MEDIA_PRIORITY_KEY = 'harness-conv-media-priority';
export const COLLAPSED_SECTIONS_KEY = 'harness-collapsed-sections';
export const MEDIA_PRESENTATIONS_KEY = 'harness-media-presentations';

export const DEFAULT_COLLAPSED_SECTIONS: CollapsedSections = {
  sources: false,
  keyFindings: false,
  internationalCoverage: false,
};

export const DEFAULT_MEDIA_PRESENTATIONS: MediaPresentations = {
  image: 'gallery',
  video: 'list',
};
