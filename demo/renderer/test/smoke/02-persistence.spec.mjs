import { test, expect } from "@playwright/test";
import { chromium } from "playwright";
import path from "node:path";
import os from "node:os";
import { PROJECTIONS, chapterUrl, CHAPTER_ID } from "./fixtures.mjs";
import {
  clearLearnerDb,
  goToProjection,
  createHighlight,
  createHighlights,
  reloadAndOpenProjection,
  inspectMarks,
  assertHealthyMarks,
  listStoredHighlights,
} from "./helpers.mjs";

const M = PROJECTIONS.mechanisms;

test.describe("V2.1 smoke — persistence", () => {
  test.beforeEach(async ({ page }) => {
    await clearLearnerDb(page);
    await goToProjection(page, M.tabIndex);
  });

  test("PE-01 single reload restores highlights", async ({ page }) => {
    await createHighlights(
      page,
      M.threeParagraphPhrases.map((phrase) => ({
        projection: M.id,
        element: M.element,
        phrase,
      }))
    );
    await reloadAndOpenProjection(page, M.tabIndex);
    const report = await inspectMarks(
      page,
      `[data-element="${M.element}"]`
    );
    expect(report.markCount).toBe(3);
    assertHealthyMarks(report, expect);
  });

  test("PE-02 multiple consecutive reloads", async ({ page }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
    });
    for (let i = 0; i < 3; i++) {
      await reloadAndOpenProjection(page, M.tabIndex);
    }
    const report = await inspectMarks(
      page,
      `[data-element="${M.element}"]`
    );
    expect(report.markCount).toBe(1);
    assertHealthyMarks(report, expect);
  });

  test("PE-03 browser restart preserves IndexedDB", async () => {
    const userDataDir = path.join(
      os.tmpdir(),
      `lou-renderer-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    const browser1 = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
    });
    const page1 = browser1.pages()[0] || (await browser1.newPage());
    await page1.goto(chapterUrl());
    await goToProjection(page1, M.tabIndex);
    await createHighlights(
      page1,
      M.threeParagraphPhrases.map((phrase) => ({
        projection: M.id,
        element: M.element,
        phrase,
      }))
    );
    await browser1.close();

    const browser2 = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
    });
    const page2 = browser2.pages()[0] || (await browser2.newPage());
    await page2.goto(chapterUrl());
    await goToProjection(page2, M.tabIndex);
    const report = await inspectMarks(
      page2,
      `[data-element="${M.element}"]`
    );
    expect(report.markCount).toBe(3);
    assertHealthyMarks(report, expect);
    await browser2.close();
  });

  test("PE-04 create highlight after reload survives next reload", async ({
    page,
  }) => {
    await createHighlights(
      page,
      M.threeParagraphPhrases.map((phrase) => ({
        projection: M.id,
        element: M.element,
        phrase,
      }))
    );
    await reloadAndOpenProjection(page, M.tabIndex);
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: "fréquence cardiaque",
    });
    await reloadAndOpenProjection(page, M.tabIndex);
    const report = await inspectMarks(
      page,
      `[data-element="${M.element}"]`
    );
    expect(report.markCount).toBe(4);
    assertHealthyMarks(report, expect);
  });

  test("PE-05 multiple create/reload cycles", async ({ page }) => {
    const phrases = [
      M.threeParagraphPhrases[0],
      M.threeParagraphPhrases[1],
      "fréquence cardiaque",
    ];
    for (const phrase of phrases) {
      await createHighlight(page, {
        projection: M.id,
        element: M.element,
        phrase,
      });
      await reloadAndOpenProjection(page, M.tabIndex);
      const stored = await listStoredHighlights(page, M.id);
      expect(stored.length).toBeGreaterThan(0);
    }
    const report = await inspectMarks(
      page,
      `[data-element="${M.element}"]`
    );
    expect(report.markCount).toBe(3);
    assertHealthyMarks(report, expect);
  });

  test("PE-06 walkthrough text unchanged after restore", async ({ page }) => {
    const before = await page.evaluate(() => {
      const wt = document.querySelector(
        '[data-element="MEC-output-basics"] .block-walkthrough'
      );
      return wt.textContent;
    });
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
    });
    await reloadAndOpenProjection(page, M.tabIndex);
    const after = await page.evaluate(() => {
      const wt = document.querySelector(
        '[data-element="MEC-output-basics"] .block-walkthrough'
      );
      return wt.textContent;
    });
    expect(after).toBe(before);
  });
});
