export interface FormExtras {
  prompt?: string;
  /** Original document files (pdf/docx/pptx/txt) — converted server-side. */
  originals?: File[];
  /** Character cap (client sysctl) for server-extracted document text. */
  documentTextLimit?: number;
}
