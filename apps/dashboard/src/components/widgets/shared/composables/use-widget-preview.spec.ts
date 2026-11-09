import { beforeEach, describe, expect, it } from 'vitest';

import { useWidgetPreview } from './use-widget-preview';

describe('useWidgetPreview', () => {
  beforeEach(() => {
    useWidgetPreview().hideWidgetPreview();
  });

  it('keeps playlist and popout previews mutually exclusive', () => {
    const preview = useWidgetPreview();

    preview.toggleWidgetPreview('playlist');
    expect(preview.playlistPreviewVisible.value).toBe(true);
    expect(preview.popoutPreviewVisible.value).toBe(false);

    preview.toggleWidgetPreview('popout');
    expect(preview.playlistPreviewVisible.value).toBe(false);
    expect(preview.popoutPreviewVisible.value).toBe(true);

    preview.toggleWidgetPreview('popout');
    expect(preview.activeWidgetPreview.value).toBeNull();
  });

  it('shares dismissal across consumers', () => {
    const settings = useWidgetPreview();
    const navigation = useWidgetPreview();
    settings.toggleWidgetPreview('playlist');

    navigation.hideWidgetPreview();

    expect(settings.playlistPreviewVisible.value).toBe(false);
    expect(navigation.activeWidgetPreview.value).toBeNull();
  });
});
