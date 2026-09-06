/**
 * Publication-quality PDF export from Markdown.
 * Powered by ShadowTalk's World-Class Document Generation & Export Engine.
 */

import {
  exportWorldClassPdf,
  printWorldClassDocument,
  parseWorldClassMarkdownBlocks,
  extractDocumentMetadata,
  DOCUMENT_THEMES,
  type DocumentTheme,
  type WorldClassExportOptions,
  type MarkdownBlock,
} from "./worldClassDocumentExport";

export {
  exportWorldClassPdf,
  printWorldClassDocument,
  parseWorldClassMarkdownBlocks as parseMarkdownBlocks,
  extractDocumentMetadata,
  DOCUMENT_THEMES,
  type DocumentTheme,
  type WorldClassExportOptions,
  type MarkdownBlock,
};

export function renderMarkdownToPdf(
  markdown: string,
  filename: string,
  options?: WorldClassExportOptions,
): void {
  exportWorldClassPdf(markdown, filename, options);
}

export function downloadProfessionalPdf(
  markdown: string,
  filename: string,
  options?: WorldClassExportOptions,
): void {
  exportWorldClassPdf(markdown, filename, options);
}
