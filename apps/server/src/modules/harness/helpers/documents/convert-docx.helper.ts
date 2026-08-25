/**
 * Convert a DOCX buffer to sanitized-source HTML (mammoth) plus its plain
 * text (raw paragraphs joined with newlines) in a single pass — the html
 * feeds the client preview, the text feeds the model prompt.
 */
export async function convertDocx(buffer: Buffer): Promise<{
  html: string;
  text: string;
}> {
  const mammoth = await import('mammoth');
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ buffer }),
    mammoth.extractRawText({ buffer }),
  ]);
  return { html: htmlResult.value, text: textResult.value };
}
