import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import type { SourcesConfig } from '../../../settings-config.model';
import type {
  SourcesPanelPatch,
  SourcesPanelProps,
} from '../SourcesPanel.types';
import { useSourcesPanel } from './use-sources-panel.composable';

function makeProps(count = 6): SourcesPanelProps {
  return reactive({
    sources: {
      preferred: [],
      blocked: [],
      imageTaskReferenceCount: count,
    } as SourcesConfig,
  });
}

function setup(count?: number) {
  const patch = vi.fn();
  const props = makeProps(count);
  const emit = patch as unknown as (
    event: 'patch',
    payload: SourcesPanelPatch,
  ) => void;
  return { props, patch, ...useSourcesPanel(props, emit) };
}

describe('useSourcesPanel', () => {
  it('reports a zero pool size as disabled', () => {
    const { referenceCount, referenceCountEnabled } = setup(0);
    expect(referenceCount.value).toBe(0);
    expect(referenceCountEnabled.value).toBe(false);
  });

  it('emits 0 (no reference images) when the checkbox is toggled off', () => {
    const { toggleReferenceCount, patch } = setup(6);
    toggleReferenceCount();
    expect(patch).toHaveBeenCalledWith('patch', {
      key: 'imageTaskReferenceCount',
      value: 0,
    });
  });

  it('restores the last non-zero count when re-enabled', () => {
    const { props, toggleReferenceCount, patch } = setup(12);
    props.sources.imageTaskReferenceCount = 0;
    toggleReferenceCount();
    expect(patch).toHaveBeenCalledWith('patch', {
      key: 'imageTaskReferenceCount',
      value: 12,
    });
  });

  it('clamps the reference count to 1..50 on change', () => {
    const { saveReferenceCount, patch } = setup(6);
    saveReferenceCount(0);
    expect(patch).toHaveBeenCalledWith('patch', {
      key: 'imageTaskReferenceCount',
      value: 1,
    });
    saveReferenceCount(99);
    expect(patch).toHaveBeenCalledWith('patch', {
      key: 'imageTaskReferenceCount',
      value: 50,
    });
  });

  it('maps a parsed list onto its config key', () => {
    const { handleListChange, patch } = setup();
    handleListChange('blocked', ['quora.com']);
    expect(patch).toHaveBeenCalledWith('patch', {
      key: 'blocked',
      value: ['quora.com'],
    });
  });
});
