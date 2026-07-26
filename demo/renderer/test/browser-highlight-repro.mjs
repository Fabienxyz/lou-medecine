/**
 * Browser smoke test: three highlights in three paragraphs, reload, verify geometry.
 * Requires: python3 -m http.server 8765 (from repo root)
 * Run: node test/browser-highlight-repro.mjs
 */
import { chromium } from "playwright";

const URL =
  "http://127.0.0.1:8765/demo/renderer/index.html?chapter=cardio/234-insuffisance-cardiaque&tab=mechanisms";

const PHRASES = [
  "débit adapté aux besoins",
  "volume d'éjection systolique",
  "précharge, la postcharge et la contractilité",
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(URL, { waitUntil: "networkidle" });
await page.evaluate(() => indexedDB.deleteDatabase("lou-learner"));
await page.reload({ waitUntil: "networkidle" });

// Default tab is story; switch to mechanisms (third published projection tab).
await page.locator(".tab").nth(2).click();
await page.waitForSelector(
  '[data-element="MEC-output-basics"] .block-walkthrough p'
);

await page.evaluate(async (phrases) => {
  const TH = window.LouTextHighlights;
  const wt = document.querySelector(
    '[data-element="MEC-output-basics"] .block-walkthrough'
  );
  for (const phrase of phrases) {
    const pos = wt.textContent.indexOf(phrase);
    const range = TH._rangeFromTextOffsets(wt, pos, pos + phrase.length);
    const selector = TH.selectorFromRange(wt, range);
    TH.wrapRangeInMark(range.cloneRange());
    await window.LouLearnerStore.addTextHighlight(
      "cardio/234",
      "mechanisms",
      "MEC-output-basics",
      selector
    );
  }
}, PHRASES);

await page.reload({ waitUntil: "networkidle" });
await page.locator(".tab").nth(2).click();
await page.waitForSelector(
  '[data-element="MEC-output-basics"] mark.learner-highlight'
);

const report = await page.evaluate((phrases) => {
  const marks = [
    ...document.querySelectorAll(
      '[data-element="MEC-output-basics"] mark.learner-highlight'
    ),
  ];
  return {
    markCount: marks.length,
    marks: marks.map((m) => {
      const rect = m.getBoundingClientRect();
      return {
        text: m.textContent,
        textLength: m.textContent.length,
        nested: !!m.querySelector("mark"),
        emptyTextChild: [...m.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent === ""
        ),
        rect: { width: rect.width, height: rect.height },
        thinVertical: rect.width > 0 && rect.width <= 4 && rect.height > 8,
      };
    }),
    phrasesPresent: phrases.map((p) =>
      marks.some((m) => m.textContent.includes(p))
    ),
  };
}, PHRASES);

console.log(JSON.stringify(report, null, 2));

const ok =
  report.markCount === 3 &&
  report.phrasesPresent.every(Boolean) &&
  report.marks.every(
    (m) =>
      m.textLength > 0 && !m.nested && !m.emptyTextChild && !m.thinVertical
  );

await browser.close();
process.exit(ok ? 0 : 1);
