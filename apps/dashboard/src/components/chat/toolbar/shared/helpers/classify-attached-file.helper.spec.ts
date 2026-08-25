import { describe, expect, it } from 'vitest';

import { classifyAttachedFile } from './classify-attached-file.helper';

function makeFile(name: string, type = ''): File {
  return new File(['x'], name, { type });
}

describe('classifyAttachedFile', () => {
  it('classifies by MIME type for images', () => {
    expect(classifyAttachedFile(makeFile('photo.png', 'image/png'))).toBe(
      'image',
    );
    expect(classifyAttachedFile(makeFile('photo.jpg', 'image/jpeg'))).toBe(
      'image',
    );
  });

  it('classifies pdf by extension', () => {
    expect(classifyAttachedFile(makeFile('report.pdf'))).toBe('pdf');
    expect(classifyAttachedFile(makeFile('REPORT.PDF'))).toBe('pdf');
  });

  it('classifies documents by extension', () => {
    expect(classifyAttachedFile(makeFile('notes.docx'))).toBe('document');
    expect(classifyAttachedFile(makeFile('slides.pptx'))).toBe('document');
    expect(classifyAttachedFile(makeFile('readme.txt'))).toBe('document');
    expect(classifyAttachedFile(makeFile('guide.md'))).toBe('document');
    expect(classifyAttachedFile(makeFile('data.csv'))).toBe('document');
    expect(classifyAttachedFile(makeFile('config.json'))).toBe('document');
  });

  it('returns null for unsupported types', () => {
    expect(classifyAttachedFile(makeFile('legacy.doc'))).toBeNull();
    expect(classifyAttachedFile(makeFile('app.exe'))).toBeNull();
    expect(classifyAttachedFile(makeFile('archive.zip'))).toBeNull();
  });
});
