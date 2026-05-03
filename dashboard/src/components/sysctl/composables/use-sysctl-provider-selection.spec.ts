import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useSysctlProviderSelection } from './use-sysctl-provider-selection';

describe('useSysctlProviderSelection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('selects the first configured provider by default', () => {
    const { selectedProvider } = useSysctlProviderSelection(() => ({
      serper: false,
      brave: true,
      searxng: false,
      browserBase: false,
    }));
    expect(selectedProvider.value).toBe('brave');
  });

  it('falls back to serper when none are configured', () => {
    const { selectedProvider } = useSysctlProviderSelection(() => ({
      serper: false,
      brave: false,
      searxng: false,
      browserBase: false,
    }));
    expect(selectedProvider.value).toBe('serper');
  });

  it('restores saved selection when it is configured', () => {
    localStorage.setItem('sysctl-selected-provider', 'brave');
    const { selectedProvider } = useSysctlProviderSelection(() => ({
      serper: true,
      brave: true,
      searxng: false,
      browserBase: false,
    }));
    expect(selectedProvider.value).toBe('brave');
  });

  it('migrates away from a saved unconfigured provider', async () => {
    localStorage.setItem('sysctl-selected-provider', 'brave');
    const { selectedProvider } = useSysctlProviderSelection(() => ({
      serper: true,
      brave: false,
      searxng: false,
      browserBase: false,
    }));
    await nextTick();
    expect(selectedProvider.value).toBe('serper');
  });

  it('persists selected provider to localStorage', async () => {
    const { selectProvider } = useSysctlProviderSelection(() => ({
      serper: true,
      brave: true,
      searxng: true,
      browserBase: true,
    }));
    selectProvider('searxng');
    await nextTick();
    expect(localStorage.getItem('sysctl-selected-provider')).toBe('searxng');
  });
});
