import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EodhdConfig } from '../../../settings-config.model';
import type { EodhdSectionProps } from '../EodhdSection.types';
import { useEodhdSection } from './use-eodhd-section';

const OFF = { enabled: false, results: 0 };

function makeProps(apiKey?: string): EodhdSectionProps {
  const config: EodhdConfig = {
    enabled: true,
    apiKey,
    search: OFF,
    quote: OFF,
    history: OFF,
    technical: OFF,
    intraday: OFF,
    news: OFF,
    fundamentals: OFF,
  };
  return { config, updateApiKey: vi.fn().mockResolvedValue(true) };
}

describe('useEodhdSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives configured state and the masked display from the API key', () => {
    expect(useEodhdSection(makeProps('sk-real')).configured.value).toBe(true);
    expect(useEodhdSection(makeProps()).configured.value).toBe(false);
    expect(useEodhdSection(makeProps('sk-real')).maskedApiKey.value).toBe(
      'sk-real',
    );
    expect(useEodhdSection(makeProps()).maskedApiKey.value).toBe('');
  });

  it('owns the API-key draft form wired to the masked display', () => {
    const props = makeProps('sk-real');
    const { draft, submit } = useEodhdSection(props);

    expect(draft.value).toBe('sk-real');
    draft.value = 'sk-new';
    void submit();
    expect(props.updateApiKey).toHaveBeenCalledWith('sk-new');
  });

  it('derives capability rows, source status, and availability from capabilities', () => {
    const props = makeProps('sk-real');
    props.config.capabilities = {
      plan: 'All-in-One',
      endpoints: { search: true, quote: false },
    } as EodhdConfig['capabilities'];
    const { capabilityRows, sourceStatus, endpointAvailability } =
      useEodhdSection(props);

    expect(capabilityRows.value?.length).toBeGreaterThan(0);
    expect(sourceStatus.value).toBeTruthy();
    expect(endpointAvailability.value).toEqual({ search: true, quote: false });
  });

  it('exposes the per-endpoint descriptions and icons', () => {
    const { descriptions, icons } = useEodhdSection(makeProps());

    expect(descriptions.value.search).toBe(
      'Resolve company/index names to tickers',
    );
    expect(Object.keys(icons).length).toBeGreaterThan(0);
  });
});
