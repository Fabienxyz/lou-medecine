import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES_DIR = path.join(__dirname, "fixtures");

/**
 * Build a tiny born-digital PDF used by integration tests.
 * Layout intentionally includes: headings, hyphenation, a page number, bullets.
 */
export async function buildSamplePdf(targetPath = path.join(FIXTURES_DIR, "sample.pdf")) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const doc = await PDFDocument.create();
  // Deterministic metadata
  doc.setTitle("Sample College");
  doc.setProducer("lou-pdf-to-canonical-tests");
  doc.setCreationDate(new Date("2024-01-01T00:00:00Z"));
  doc.setModificationDate(new Date("2024-01-01T00:00:00Z"));

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page1 = doc.addPage([595.28, 841.89]);
  let y = 800;
  const draw = (text, size, f = font, x = 50) => {
    page1.drawText(text, { x, y, size, font: f });
    y -= size + 8;
  };

  draw("Chapitre 01 – Item 999 : Exemple de chapitre", 22, fontBold);
  draw("By SFC Published On: 07/11/2024", 10);
  // Display-size section heading (not sommaire body-size)
  draw("I. Généralités", 18, fontBold);
  draw("Ceci est un paragraphe d’introduction qui se poursuit", 12);
  // Soft-hyphenated break across lines: "physiopathologie"
  page1.drawText("sur plusieurs lignes avec physiopatho-", {
    x: 50,
    y,
    size: 12,
    font,
  });
  y -= 20;
  page1.drawText("logie et listes.", { x: 50, y, size: 12, font });
  y -= 28;
  draw("A Définitions", 13, fontBold);
  draw("• premier élément", 12);
  draw("• deuxième élément", 12);
  draw("– sous-élément indenté", 12);
  // Page number at bottom
  page1.drawText("1", { x: 290, y: 30, size: 10, font });

  const page2 = doc.addPage([595.28, 841.89]);
  page2.drawText("II. Diagnostic", { x: 50, y: 800, size: 14, font: fontBold });
  page2.drawText("La suite du chapitre.", { x: 50, y: 770, size: 12, font });
  page2.drawText("2", { x: 290, y: 30, size: 10, font });

  const bytes = await doc.save({ useObjectStreams: false });
  fs.writeFileSync(targetPath, bytes);
  return targetPath;
}

export function makeLine(text, overrides = {}) {
  return {
    page: 1,
    y: 700,
    x: 36,
    text,
    fontSize: 12,
    pageWidth: 595.2,
    pageHeight: 841.92,
    ...overrides,
  };
}
