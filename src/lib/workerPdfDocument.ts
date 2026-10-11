import { jsPDF } from "jspdf";

export interface PdfLinkItem {
  caption: string;
  url: string;
}

export interface PdfField {
  label: string;
  text?: string;
  links?: PdfLinkItem[];
}

export interface PdfSection {
  title: string;
  fields: PdfField[];
}

export interface PdfWorkerRecord {
  heading: string;
  sections: PdfSection[];
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LABEL_W = 64;
const VALUE_X = MARGIN + LABEL_W + 4;
const VALUE_W = PAGE_W - MARGIN - VALUE_X;
const CONTENT_BOTTOM = 280;
const BANNER_H = 22;
const CONTINUED_H = 12;

const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const BRAND: [number, number, number] = [43, 75, 238];
const HEADER: [number, number, number] = [23, 42, 120];
const LINK: [number, number, number] = [29, 78, 216];

function pdfSafe(value: string): string {
  return value
    .replace(/[^\n\r\t\u0020-\u007E\u00A0-\u00FF]/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

function hardWrap(doc: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    if (doc.getTextWidth(rest) <= maxWidth) {
      lines.push(rest);
      break;
    }
    let lo = 1;
    let hi = rest.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (doc.getTextWidth(rest.slice(0, mid)) <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    lines.push(rest.slice(0, Math.max(lo, 1)));
    rest = rest.slice(Math.max(lo, 1));
  }
  return lines.length ? lines : [""];
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let current = "";
    const flush = () => {
      if (current) lines.push(current);
      current = "";
    };
    for (const word of words) {
      if (doc.getTextWidth(word) > maxWidth) {
        flush();
        lines.push(...hardWrap(doc, word, maxWidth));
        continue;
      }
      const next = current ? `${current} ${word}` : word;
      if (doc.getTextWidth(next) <= maxWidth) current = next;
      else {
        flush();
        current = word;
      }
    }
    flush();
  }
  return lines.length ? lines : [""];
}

export function buildWorkerExportPdf(records: PdfWorkerRecord[], exportedOn: string): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `SafeWork Global worker export ${exportedOn}`,
    creator: "SafeWork Global",
  });

  let y = BANNER_H + 8;
  let heading = "Worker";

  const paintBanner = () => {
    doc.setFillColor(...HEADER);
    doc.rect(0, 0, PAGE_W, BANNER_H, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("SafeWork Global", MARGIN, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Worker data export", MARGIN, 16.5);
    doc.text(exportedOn, PAGE_W - MARGIN, 13, { align: "right" });
  };

  const paintContinued = () => {
    doc.setFillColor(...HEADER);
    doc.rect(0, 0, PAGE_W, CONTINUED_H, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const brand = "SafeWork Global";
    const brandWidth = doc.getTextWidth(brand);
    doc.text(brand, MARGIN, 7.6);
    doc.setFont("helvetica", "normal");
    const suffix = "  ·  continued";
    const maxWidth = CONTENT_W - brandWidth - doc.getTextWidth(suffix) - 8;
    let name = heading;
    while (name.length > 1 && doc.getTextWidth(name) > maxWidth) name = name.slice(0, -1);
    if (name !== heading) name = `${name.trimEnd()}...`;
    doc.text(`${name}${suffix}`, PAGE_W - MARGIN, 7.6, { align: "right" });
  };

  const ensure = (height: number) => {
    if (y + height <= CONTENT_BOTTOM) return;
    doc.addPage();
    paintContinued();
    y = CONTINUED_H + 8;
  };

  const drawUrl = (url: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines = hardWrap(doc, url, CONTENT_W);
    for (const line of lines) {
      ensure(4.2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...LINK);
      doc.textWithLink(line, MARGIN, y, { url });
      const width = doc.getTextWidth(line);
      doc.setDrawColor(...LINK);
      doc.setLineWidth(0.15);
      doc.line(MARGIN, y + 0.55, MARGIN + width, y + 0.55);
      y += 3.7;
    }
  };

  const drawTextField = (field: PdfField) => {
    const value = pdfSafe(field.text || "") || "Not provided";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const label = pdfSafe(field.label) || field.label;
    const wideLabel = doc.getTextWidth(label) > LABEL_W - 1;
    const block = wideLabel || value.includes("\n") || value.length > 80;
    if (block) {
      ensure(9);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text(label, MARGIN, y);
      y += 4.4;
      doc.setFont("helvetica", "normal");
      const lines = wrapText(doc, value, CONTENT_W);
      for (const line of lines) {
        ensure(4.4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...INK);
        doc.text(line || " ", MARGIN, y);
        y += 4.2;
      }
      y += 1.6;
      return;
    }
    const lines = wrapText(doc, value, VALUE_W);
    ensure(lines.length * 4.2 + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(label, MARGIN, y);
    doc.setTextColor(...INK);
    for (const line of lines) {
      doc.text(line, VALUE_X, y);
      y += 4.2;
    }
    y += 1.2;
  };

  const drawLinkField = (field: PdfField) => {
    ensure(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(field.label) || field.label, MARGIN, y);
    y += 4.6;
    const items = field.links ?? [];
    if (!items.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("None on file", MARGIN, y);
      y += 6;
      return;
    }
    for (const item of items) {
      const caption = pdfSafe(item.caption);
      if (caption) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const captionLines = wrapText(doc, caption, CONTENT_W);
        for (const line of captionLines) {
          ensure(3.8);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...MUTED);
          doc.text(line, MARGIN, y);
          y += 3.5;
        }
      }
      if (item.url) drawUrl(item.url);
      else {
        ensure(4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text("Link unavailable", MARGIN, y);
        y += 3.8;
      }
      y += 2;
    }
  };

  const drawSection = (section: PdfSection) => {
    ensure(18);
    y += 2.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND);
    doc.text(section.title.toUpperCase(), MARGIN, y);
    y += 1.8;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 5.2;
    for (const field of section.fields) {
      if (field.links) drawLinkField(field);
      else drawTextField(field);
    }
  };

  records.forEach((record, index) => {
    heading = pdfSafe(record.heading) || "Worker";
    if (index > 0) doc.addPage();
    paintBanner();
    y = BANNER_H + 10;
    if (records.length > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(`Worker ${index + 1} of ${records.length}`, MARGIN, y);
      y += 5;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...INK);
    const nameLines = wrapText(doc, heading, CONTENT_W);
    for (const line of nameLines) {
      ensure(7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...INK);
      doc.text(line, MARGIN, y);
      y += 6.4;
    }
    y += 1;
    for (const section of record.sections) drawSection(section);
  });

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Photo, video, and document links stay valid for 7 days.", MARGIN, PAGE_H - 7);
    doc.text(`Page ${page} of ${total}`, PAGE_W - MARGIN, PAGE_H - 7, { align: "right" });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
