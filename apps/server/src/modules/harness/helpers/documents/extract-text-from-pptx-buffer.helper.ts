import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';

const DRAWINGML_NAMESPACE =
  'http://schemas.openxmlformats.org/drawingml/2006/main';

/**
 * Extract the text of a .pptx buffer by unzipping it and reading the <a:t>
 * text runs of every slide, in slide order. Formatting is discarded — the
 * model reads the content, not the layout.
 */
export async function extractTextFromPptxBuffer(
  buffer: Buffer,
): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => slideNumber(a) - slideNumber(b));

  const parser = new DOMParser();
  const slides: string[] = [];
  for (const name of slideNames) {
    const entry = zip.file(name);
    if (!entry) continue;
    const xml = await entry.async('string');
    const doc = parser.parseFromString(xml, 'application/xml');
    const texts = Array.from(
      doc.getElementsByTagNameNS(DRAWINGML_NAMESPACE, 't'),
    ).map((el) => el.textContent ?? '');
    slides.push(texts.join(' '));
  }
  return slides.join('\n\n');
}

function slideNumber(name: string): number {
  return Number(name.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
}
