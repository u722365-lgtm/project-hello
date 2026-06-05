/**
 * Publication-quality PDF export from Markdown.
 * Replaces screenshot-based and naive line-dump exporters.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { polishProfessionalMarkdown } from "./professionalDocument";

const MARGIN = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 12;

type MarkdownBlock =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "blockquote"; text: string }
  | { kind: "hr" }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "table"; rows: string[][] }
  | { kind: "code"; text: string };

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .map((c) => stripInlineMarkdown(c.trim()))
    .filter((c) => c && !/^[-:]+$/.test(c));
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();

    if (t.startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (codeLines.length) blocks.push({ kind: "code", text: codeLines.join("\n") });
      i += 1;
      continue;
    }

    if (t.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = parseTableRow(lines[i]);
        if (cells.length) rows.push(cells);
        i += 1;
      }
      if (rows.length) blocks.push({ kind: "table", rows });
      continue;
    }

    if (/^[-*+]\s/.test(t) || /^[-*+]\s\[[ xX]\]/.test(t)) {
      const items: string[] = [];
      while (i < lines.length) {
        const lt = lines[i].trim();
        const bullet = lt.match(/^[-*+]\s(?:\[[ xX]\]\s)?(.+)$/);
        if (!bullet) break;
        items.push(stripInlineMarkdown(bullet[1]));
        i += 1;
      }
      if (items.length) blocks.push({ kind: "ul", items });
      continue;
    }

    if (/^\d+\.\s/.test(t)) {
      const items: string[] = [];
      while (i < lines.length) {
        const lt = lines[i].trim();
        const numbered = lt.match(/^\d+\.\s+(.+)$/);
        if (!numbered) break;
        items.push(stripInlineMarkdown(numbered[1]));
        i += 1;
      }
      if (items.length) blocks.push({ kind: "ol", items });
      continue;
    }

    if (t.startsWith("# ")) {
      blocks.push({ kind: "h1", text: stripInlineMarkdown(t.slice(2)) });
    } else if (t.startsWith("## ")) {
      blocks.push({ kind: "h2", text: stripInlineMarkdown(t.slice(3)) });
    } else if (t.startsWith("### ")) {
      blocks.push({ kind: "h3", text: stripInlineMarkdown(t.slice(4)) });
    } else if (t.startsWith("#### ")) {
      blocks.push({ kind: "h3", text: stripInlineMarkdown(t.slice(5)) });
    } else if (t.startsWith("> ")) {
      const quoteLines: string[] = [stripInlineMarkdown(t.slice(2))];
      i += 1;
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(stripInlineMarkdown(lines[i].trim().slice(2)));
        i += 1;
      }
      blocks.push({ kind: "blockquote", text: quoteLines.join(" ") });
      continue;
    } else if (t === "---" || t === "***") {
      blocks.push({ kind: "hr" });
    } else if (t) {
      blocks.push({ kind: "p", text: stripInlineMarkdown(t) });
    }

    i += 1;
  }

  return blocks;
}

type PdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

export function renderMarkdownToPdf(markdown: string, filename: string): void {
  const clean = polishProfessionalMarkdown(markdown, { tone: "professional" });
  const blocks = parseMarkdownBlocks(clean);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > FOOTER_Y - 4) {
      pdf.addPage();
      y = MARGIN;
    }
  };

  const drawWrapped = (
    text: string,
    opts: { fontSize: number; fontStyle: "normal" | "bold" | "italic"; color: [number, number, number]; lineHeight: number; indent?: number },
  ) => {
    const indent = opts.indent ?? 0;
    pdf.setFontSize(opts.fontSize);
    pdf.setFont("times", opts.fontStyle);
    pdf.setTextColor(...opts.color);
    const lines = pdf.splitTextToSize(text, CONTENT_WIDTH - indent);
    for (const line of lines) {
      ensureSpace(opts.lineHeight);
      pdf.text(line, MARGIN + indent, y);
      y += opts.lineHeight;
    }
  };

  for (const block of blocks) {
    switch (block.kind) {
      case "h1": {
        y += 2;
        drawWrapped(block.text, { fontSize: 22, fontStyle: "bold", color: [20, 20, 20], lineHeight: 9 });
        pdf.setDrawColor(180, 180, 180);
        ensureSpace(4);
        pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 8;
        break;
      }
      case "h2": {
        y += 6;
        drawWrapped(block.text, { fontSize: 15, fontStyle: "bold", color: [35, 35, 35], lineHeight: 7 });
        y += 3;
        break;
      }
      case "h3": {
        y += 4;
        drawWrapped(block.text, { fontSize: 12, fontStyle: "bold", color: [50, 50, 50], lineHeight: 6 });
        y += 2;
        break;
      }
      case "p": {
        drawWrapped(block.text, { fontSize: 11, fontStyle: "normal", color: [40, 40, 40], lineHeight: 5.5 });
        y += 2;
        break;
      }
      case "blockquote": {
        const quoteLines = pdf.splitTextToSize(block.text, CONTENT_WIDTH - 14);
        const boxHeight = quoteLines.length * 5 + 8;
        ensureSpace(boxHeight + 2);
        pdf.setFillColor(245, 245, 245);
        pdf.setDrawColor(120, 120, 120);
        pdf.rect(MARGIN, y - 3, CONTENT_WIDTH, boxHeight, "FD");
        pdf.setDrawColor(90, 90, 90);
        pdf.line(MARGIN + 2, y - 1, MARGIN + 2, y + boxHeight - 5);
        pdf.setFontSize(10.5);
        pdf.setFont("times", "italic");
        pdf.setTextColor(70, 70, 70);
        pdf.text(quoteLines, MARGIN + 8, y + 3);
        y += boxHeight + 4;
        break;
      }
      case "hr": {
        y += 4;
        ensureSpace(6);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 8;
        break;
      }
      case "ul": {
        for (const item of block.items) {
          drawWrapped(`• ${item}`, { fontSize: 11, fontStyle: "normal", color: [40, 40, 40], lineHeight: 5.5, indent: 4 });
        }
        y += 2;
        break;
      }
      case "ol": {
        block.items.forEach((item, idx) => {
          drawWrapped(`${idx + 1}. ${item}`, { fontSize: 11, fontStyle: "normal", color: [40, 40, 40], lineHeight: 5.5, indent: 4 });
        });
        y += 2;
        break;
      }
      case "table": {
        const head = block.rows[0];
        const body = block.rows.slice(1).filter((row) => row.some((c) => c.trim()));
        ensureSpace(20);
        autoTable(pdf, {
          startY: y,
          head: [head],
          body,
          margin: { left: MARGIN, right: MARGIN },
          styles: {
            font: "times",
            fontSize: 9.5,
            cellPadding: 3,
            textColor: [40, 40, 40],
            lineColor: [200, 200, 200],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [30, 30, 30],
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          theme: "grid",
        });
        const finalY = (pdf as PdfWithAutoTable).lastAutoTable?.finalY;
        y = (finalY ?? y) + 8;
        break;
      }
      case "code": {
        const codeLines = pdf.splitTextToSize(block.text, CONTENT_WIDTH - 12);
        const boxHeight = codeLines.length * 4.5 + 8;
        ensureSpace(boxHeight);
        pdf.setFillColor(248, 248, 248);
        pdf.setDrawColor(210, 210, 210);
        pdf.rect(MARGIN, y - 2, CONTENT_WIDTH, boxHeight, "FD");
        pdf.setFont("courier", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(50, 50, 50);
        pdf.text(codeLines, MARGIN + 6, y + 4);
        y += boxHeight + 4;
        break;
      }
    }
  }

  const pageCount = pdf.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(140, 140, 140);
    pdf.text("Generated by ShadowTalk AI", MARGIN, FOOTER_Y);
    pdf.text(dateStr, PAGE_WIDTH - MARGIN, FOOTER_Y, { align: "right" });
    pdf.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH / 2, FOOTER_Y, { align: "center" });
  }

  const safeName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(safeName);
}

export function downloadProfessionalPdf(markdown: string, filename: string): void {
  renderMarkdownToPdf(markdown, filename);
}
