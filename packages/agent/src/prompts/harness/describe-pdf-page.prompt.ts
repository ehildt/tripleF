/**
 * One vision pass over a single rendered pdf page (multimodal: prompt text +
 * page image): describe the layout AND transcribe every visible text verbatim.
 * The output is written permanently into the document's encyclopedia entry
 * next to the extracted text layer, so it must be self-contained and complete
 * — a later reader (model or human) may never see any other page.
 *
 * Deliberately free-text (no structured JSON): the stored description is
 * prose+transcription the encyclopedia chunks and embeds as-is.
 */
export function buildDescribePdfPagePrompt(documentName: string, pageNumber: number, pageCount: number): string {
  return [
    `You are looking at page ${pageNumber} of ${pageCount} of the PDF document "${documentName}" (attached as an image).`,
    ``,
    `Describe this page so it can be stored permanently in a document knowledge base:`,
    `1. Layout: how the page is structured (header, sections, columns, tables, lists, figures, images, footer).`,
    `2. Transcription: ALL text visible on the page, verbatim, in reading order. Do not summarize, abridge, paraphrase, or skip anything — including headings, footnotes, captions, table cells, and code blocks.`,
    `3. Figures and images: one brief factual sentence each (what it depicts, labels, axis titles, legend).`,
    ``,
    `Rules:`,
    `- Describe only what is actually on the page. Never invent content, and never reference other pages or assume context from them.`,
    `- Write plain prose. No commentary about your task, no markdown fences, no JSON.`,
    `- When the page carries no readable content (blank or pure decoration), answer exactly: "This page contains no readable content."`,
  ].join('\n');
}
