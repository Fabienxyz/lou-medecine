/**
 * Playwright viewport validation for semantic HTML visuals.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolvePlaywright } from "./playwright.js";

export const VIEWPORT_WIDTHS = [375, 768, 1280, 530];
export const MIN_FONT_PX = 12;

export async function validateHtmlViewport(htmlPath, options = {}) {
  const widths = options.widths || VIEWPORT_WIDTHS;
  const minFontPx = options.minFontPx ?? MIN_FONT_PX;
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();

  const allErrors = [];

  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {
        waitUntil: "networkidle",
      });

      const label = `${path.basename(htmlPath)} @ ${width}px`;
      const issues = await page.evaluate(
        ({ minFont, viewportWidth }) => {
          const problems = [];
          const root = document.documentElement;
          const body = document.body;

          if (root.scrollWidth > root.clientWidth + 1) {
            problems.push(
              `document scrollWidth ${root.scrollWidth} > clientWidth ${root.clientWidth}`,
            );
          }
          if (body.scrollWidth > body.clientWidth + 1) {
            problems.push(
              `body scrollWidth ${body.scrollWidth} > clientWidth ${body.clientWidth}`,
            );
          }

          for (const el of document.querySelectorAll("body *")) {
            const style = window.getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") continue;
            if (style.opacity === "0") continue;
            if (el.classList.contains("vg-sr-only")) continue;

            const rect = el.getBoundingClientRect();
            const hasText = (el.textContent || "").trim().length > 0;
            const isMedia = el.tagName === "MATH" || el.tagName === "IMG";

            if (hasText || isMedia) {
              if (rect.width > 0 && rect.height === 0) {
                problems.push(`zero height visible: ${el.tagName}.${el.className}`);
              }
              const fontSize = parseFloat(style.fontSize);
              if (hasText && fontSize > 0 && fontSize < minFont) {
                problems.push(
                  `font below minimum (${fontSize}px): ${el.tagName}.${el.className}`,
                );
              }
            }

            if (rect.right > viewportWidth + 1 && rect.width > 0) {
              problems.push(
                `overflow right (${Math.round(rect.right)} > ${viewportWidth}): ${el.tagName}.${el.className}`,
              );
            }
            if (rect.left < -1) {
              problems.push(
                `overflow left (${Math.round(rect.left)}): ${el.tagName}.${el.className}`,
              );
            }
          }

          const question = document.querySelector(".vg-question");
          if (question && viewportWidth <= 375 && !question.querySelector(".vg-question-mark")) {
            const text = (question.textContent || "").trim();
            if (text.endsWith("?")) {
              const walker = document.createTreeWalker(question, NodeFilter.SHOW_TEXT);
              let lastTextNode = null;
              while (walker.nextNode()) lastTextNode = walker.currentNode;
              if (lastTextNode) {
                const range = document.createRange();
                const content = lastTextNode.textContent || "";
                const qIndex = content.lastIndexOf("?");
                if (qIndex >= 0) {
                  if (qIndex > 0) {
                    range.setStart(lastTextNode, qIndex - 1);
                    range.setEnd(lastTextNode, qIndex + 1);
                  } else {
                    range.selectNodeContents(lastTextNode);
                  }
                  const qRect = range.getBoundingClientRect();
                  range.setStart(lastTextNode, 0);
                  range.setEnd(lastTextNode, Math.max(0, qIndex));
                  const beforeRect = range.getBoundingClientRect();
                  if (
                    qRect.width > 0 &&
                    beforeRect.width > 0 &&
                    Math.abs(qRect.top - beforeRect.top) > qRect.height * 0.5 &&
                    qRect.width < beforeRect.width * 0.25
                  ) {
                    problems.push("orphan question punctuation: ? isolated on its own line");
                  }
                }
              }
            }
          }

          return problems;
        },
        { minFont: minFontPx, viewportWidth: width },
      );

      for (const issue of issues) {
        allErrors.push(`${label}: ${issue}`);
      }
    }
  } finally {
    await browser.close();
  }

  return { ok: allErrors.length === 0, errors: allErrors, widths };
}
