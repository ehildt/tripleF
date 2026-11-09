import { describe, expect, it } from 'vitest';

import type { OllamaModel } from '@/types/ollama-model.model';

import { selectPickerModels } from './select-picker-models.helper';

const models: OllamaModel[] = [
  { model: 'qwen', origin: 'local', capabilities: ['completion'] },
  { model: 'kimi', origin: 'cloud', capabilities: ['completion'] },
  { model: 'Mistral', capabilities: ['completion'] },
  { model: 'gpt', origin: 'cloud', capabilities: ['completion'] },
  { model: 'embed', origin: 'local', capabilities: [] },
  { model: 'unknown', origin: 'local' },
];

describe('selectPickerModels', () => {
  it('selects and case-insensitively sorts eligible local models', () => {
    expect(
      selectPickerModels(models, 'local').map((model) => model.model),
    ).toEqual(['Mistral', 'qwen']);
  });

  it('selects and sorts eligible cloud models', () => {
    expect(
      selectPickerModels(models, 'cloud').map((model) => model.model),
    ).toEqual(['gpt', 'kimi']);
  });

  it('returns a new array without sorting the source catalog', () => {
    const result = selectPickerModels(models, 'local');

    expect(result).not.toBe(models);
    expect(models.map((model) => model.model)).toEqual([
      'qwen',
      'kimi',
      'Mistral',
      'gpt',
      'embed',
      'unknown',
    ]);
  });

  it('returns an empty group when no models are eligible', () => {
    expect(selectPickerModels([], 'local')).toEqual([]);
  });
});
