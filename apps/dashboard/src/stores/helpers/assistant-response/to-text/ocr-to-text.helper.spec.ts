import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { ocrToText } from './ocr-to-text.helper';

describe('ocrToText', () => {
  it('labels the extracted text separately from observations', () => {
    const data: AssistantResponseData = {
      sectionContent: 'scanned words',
      keyFindings: [{ text: 'observation' }],
    };
    const text = ocrToText(data);
    expect(text).toContain('Extracted text:\nscanned words');
    expect(text).toContain('Observations:');
    expect(text).toContain('- observation');
  });
});
