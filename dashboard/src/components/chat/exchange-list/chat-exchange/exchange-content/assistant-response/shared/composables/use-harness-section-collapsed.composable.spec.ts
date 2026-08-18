import { computed, provide } from 'vue';

import { runInSetup } from '@/test-utils/run-in-setup';
import type { CollapsedSections } from '@/types/harness-response-data.model';
import { sectionCollapsedKey } from '@/types/harness-response-data.model';

import { useHarnessSectionCollapsed } from './use-harness-section-collapsed.composable';

const COLLAPSED: CollapsedSections = {
  sources: false,
  keyFindings: true,
  internationalCoverage: false,
};

describe('useHarnessSectionCollapsed', () => {
  it('defaults to expanded when no provider is present', () => {
    const isCollapsed = runInSetup(() => useHarnessSectionCollapsed('sources'));
    expect(isCollapsed.value).toBe(false);
  });

  it('reads the collapse state for its section type from the provider', () => {
    const isCollapsed = runInSetup(
      () => useHarnessSectionCollapsed('keyFindings'),
      () =>
        provide(
          sectionCollapsedKey,
          computed(() => COLLAPSED),
        ),
    );
    expect(isCollapsed.value).toBe(true);
  });

  it('leaves other section types expanded', () => {
    const isCollapsed = runInSetup(
      () => useHarnessSectionCollapsed('sources'),
      () =>
        provide(
          sectionCollapsedKey,
          computed(() => COLLAPSED),
        ),
    );
    expect(isCollapsed.value).toBe(false);
  });
});
