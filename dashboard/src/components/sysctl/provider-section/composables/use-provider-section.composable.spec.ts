import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import type { ProviderConfig } from '../../sysctl-config.model';
import type { ProviderSectionProps } from '../ProviderSection.types';
import { useProviderSection } from './use-provider-section.composable';

function makeProps(
  config: ProviderConfig,
  overrides: Partial<ProviderSectionProps> = {},
): ProviderSectionProps {
  return reactive({
    providerName: 'Test',
    providerDescription: 'desc',
    config,
    descriptions: {},
    configured: true,
    ...overrides,
  });
}

describe('useProviderSection', () => {
  it('excludes apiKey, enabled, and projectId from the endpoint entries', () => {
    const { endpointEntries } = useProviderSection(
      makeProps({
        apiKey: 'secret',
        enabled: true,
        projectId: 'p1',
        web: { enabled: true },
        images: { enabled: false },
      } as ProviderConfig),
    );
    expect(endpointEntries.value.map(([name]) => name)).toEqual([
      'web',
      'images',
    ]);
  });

  it('sorts endpoints without a results number first', () => {
    const { endpointEntries } = useProviderSection(
      makeProps({
        web: { enabled: true, results: 5 },
        images: { enabled: true },
      } as ProviderConfig),
    );
    expect(endpointEntries.value.map(([name]) => name)).toEqual([
      'images',
      'web',
    ]);
  });

  it('computes the items per row from the endpoint count', () => {
    const { itemsPerRow } = useProviderSection(
      makeProps({
        web: { enabled: true },
        images: { enabled: true },
        news: { enabled: true },
        places: { enabled: true },
      } as ProviderConfig),
    );
    expect(itemsPerRow.value).toBe(2);
  });

  it('locks endpoints that are explicitly unavailable', () => {
    const { isEndpointUnavailable } = useProviderSection(
      makeProps({ web: { enabled: true } } as ProviderConfig, {
        endpointAvailability: { web: false },
      }),
    );
    expect(isEndpointUnavailable('web')).toBe(true);
    expect(isEndpointUnavailable('images')).toBe(false);
  });
});
