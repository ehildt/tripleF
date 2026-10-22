import type { AssistantResponseData } from '@/types/assistant-response-data.model';

/** True when a merge response carries any renderable content. */
export function hasAnyMergeContent(data: AssistantResponseData): boolean {
  return Boolean(
    data.category ||
    data.title ||
    data.subtitle ||
    data.summary ||
    data.introduction ||
    data.subject ||
    data.verdict ||
    data.reasoning ||
    data.strengths?.length ||
    data.weaknesses?.length ||
    data.recommendations?.length ||
    data.subjects?.length ||
    data.comparison ||
    data.mergedEvaluations?.length ||
    data.bodySections?.length ||
    data.sectionTitle ||
    data.sectionContent ||
    data.keyFindings?.length ||
    data.cards?.length ||
    data.galleryItems?.length ||
    data.videoGalleryItems?.length ||
    data.sources?.length ||
    data.internationalCoverage?.length ||
    data.heroImageUrl ||
    data.heroVideoUrl,
  );
}
