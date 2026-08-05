/**
 * HTML reflow validation — visible mode vs CompositionPlan.reflowByWidth.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolvePlaywright } from "../playwright.js";
import { W1_VIEWPORT_WIDTHS } from "./w1-constants.js";

function evaluateHtmlReflowVisibility() {
  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) return false;
    return el.getClientRects().length > 0;
  }

  const table = document.querySelector(".vg-matrix-desktop");
  const mobile = document.querySelector(".vg-matrix-mobile");
  const grid = document.querySelector(".vg-w1-grid");
  const tableVisible = isElementVisible(table);
  const cardsVisible = isElementVisible(mobile);
  const breakpoint = Number(
    document.querySelector("[data-reflow-breakpoint]")?.getAttribute("data-reflow-breakpoint") ?? 768,
  );
  let gridColumns = null;
  if (grid) {
    const style = window.getComputedStyle(grid);
    const cols = style.gridTemplateColumns.split(" ").filter(Boolean);
    gridColumns = cols.length;
  }
  let visibleItemCount = 0;
  for (const el of document.querySelectorAll("[data-item-id], .vg-matrix-card, .vg-w1-grid li")) {
    if (isElementVisible(el)) visibleItemCount++;
  }
  return {
    tableVisible,
    cardsVisible,
    breakpoint,
    gridColumns,
    visibleItemCount,
    viewportWidth: window.innerWidth,
  };
}

export async function validateW1HtmlReflowAtWidth(plan, htmlPath, viewportWidth, familyId) {
  const expected = plan?.reflowByWidth?.[viewportWidth] ?? plan?.reflowByWidth?.[String(viewportWidth)];
  if (!expected) {
    return {
      ok: false,
      errors: [`plan missing reflowByWidth[${viewportWidth}]`],
      detail: null,
    };
  }

  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: viewportWidth, height: 800 } });
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, { waitUntil: "networkidle" });
    await page.evaluate(({ vw }) => {
      document.body.style.width = `${vw}px`;
      document.body.style.margin = "0 auto";
    }, { vw: viewportWidth });

    const observed = await page.evaluate(evaluateHtmlReflowVisibility);
    const errors = [];
    const detail = { viewportWidth, expected, observed };

    if (familyId === "two-pole") {
      const tableBp = Object.keys(plan.reflowByWidth || {})
        .map(Number)
        .sort((a, b) => a - b)
        .find((w) => plan.reflowByWidth[w]?.mode === "table");
      const bp = tableBp ?? 768;
      detail.planBreakpoint = bp;
      detail.planMode = expected.mode;

      if (viewportWidth < bp) {
        if (!observed.cardsVisible) errors.push("REFLOW_CARDS_HIDDEN");
        if (observed.tableVisible) errors.push("REFLOW_TABLE_VISIBLE_BELOW_BREAKPOINT");
        if (expected.mode !== "card-pairs") errors.push(`REFLOW_PLAN_MODE_MISMATCH expected card-pairs got ${expected.mode}`);
      } else {
        if (!observed.tableVisible) errors.push("REFLOW_TABLE_HIDDEN");
        if (observed.cardsVisible) errors.push("REFLOW_CARDS_VISIBLE_AT_OR_ABOVE_BREAKPOINT");
        if (expected.mode !== "table") errors.push(`REFLOW_PLAN_MODE_MISMATCH expected table got ${expected.mode}`);
      }
      if (!observed.tableVisible && !observed.cardsVisible) {
        errors.push("REFLOW_BOTH_HIDDEN");
      }
      if (observed.tableVisible && observed.cardsVisible) {
        errors.push("REFLOW_BOTH_VISIBLE");
      }
    }

    if (familyId === "flat-concurrent") {
      const expectedCols = expected.columns ?? 1;
      if (observed.gridColumns != null && observed.gridColumns !== expectedCols) {
        errors.push(`REFLOW_COLUMNS_MISMATCH expected ${expectedCols} observed ${observed.gridColumns}`);
      }
      if (expected.mode !== "grid") {
        errors.push(`REFLOW_PLAN_MODE_MISMATCH expected grid got ${expected.mode}`);
      }
    }

    return { ok: errors.length === 0, errors, detail };
  } finally {
    await browser.close();
  }
}

/** Mutant: shift CSS breakpoint in artifact without changing plan — must fail reflow validation. */
export function mutateHtmlReflowBreakpoint(artifactHtml, wrongBreakpoint) {
  const bp = Number(wrongBreakpoint);
  return artifactHtml
    .replace(
      /@media\s*\(\s*max-width:\s*\d+px\s*\)\s*\{\s*\.vg-matrix-desktop\{display:none!important\}\s*\.vg-matrix-mobile\{display:block\}\}/g,
      `@media (max-width:${bp - 1}px){.vg-matrix-desktop{display:none!important}.vg-matrix-mobile{display:block}}`,
    )
    .replace(
      /@media\s*\(\s*min-width:\s*\d+px\s*\)\s*\{\s*\.vg-matrix-mobile\{display:none!important\}\s*\.vg-matrix-desktop\{display:table\}\}/g,
      `@media (min-width:${bp}px){.vg-matrix-mobile{display:none!important}.vg-matrix-desktop{display:table}}`,
    );
}

export async function validateW1HtmlReflowMutant(plan, htmlPath, viewportWidth, familyId, wrongBreakpoint) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const mutant = mutateHtmlReflowBreakpoint(html, wrongBreakpoint);
  const tmp = path.join(path.dirname(htmlPath), `.reflow-mutant-${viewportWidth}.html`);
  fs.writeFileSync(tmp, mutant);
  try {
    const result = await validateW1HtmlReflowAtWidth(plan, tmp, viewportWidth, familyId);
    return { ...result, mutantExpectedFail: !result.ok };
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

export { evaluateHtmlReflowVisibility, W1_VIEWPORT_WIDTHS };
