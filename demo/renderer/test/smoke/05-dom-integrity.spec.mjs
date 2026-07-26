import { test, expect } from "@playwright/test";
import { PROJECTIONS } from "./fixtures.mjs";
import {
  clearLearnerDb,
  goToProjection,
  createHighlights,
  reloadAndOpenProjection,
  inspectMarks,
  assertHealthyMarks,
} from "./helpers.mjs";

const M = PROJECTIONS.mechanisms;

test.describe("V2.1 smoke — DOM integrity", () => {
  test.beforeEach(async ({ page }) => {
    await clearLearnerDb(page);
    await goToProjection(page, M.tabIndex);
  });

  test("DI-01 no nested learner-highlight marks after restore", async ({
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
    const report = await inspectMarks(
      page,
      `[data-element="${M.element}"]`
    );
    expect(report.markCount).toBe(3);
    assertHealthyMarks(report, expect);
  });

  test("DI-02 no empty learner-highlight marks", async ({ page }) => {
    await createHighlights(
      page,
      M.sameParagraphPhrases.map((phrase) => ({
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
    for (const m of report.marks) {
      expect(m.textLength).toBeGreaterThan(0);
    }
  });

  test("DI-03 no unexpected BR inside marks", async ({ page }) => {
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
    expect(report.unexpectedBrInWalkthrough).toBe(false);
  });

  test("DI-04 paragraph structure preserved", async ({ page }) => {
    const before = await page.evaluate(() => {
      const wt = document.querySelector(
        '[data-element="MEC-output-basics"] .block-walkthrough'
      );
      return wt.querySelectorAll("p").length;
    });
    await createHighlights(
      page,
      M.threeParagraphPhrases.map((phrase) => ({
        projection: M.id,
        element: M.element,
        phrase,
      }))
    );
    await reloadAndOpenProjection(page, M.tabIndex);
    const after = await page.evaluate(() => {
      const wt = document.querySelector(
        '[data-element="MEC-output-basics"] .block-walkthrough'
      );
      return wt.querySelectorAll("p").length;
    });
    expect(after).toBe(before);
  });

  test("DI-05 highlight text preserved exactly after reload", async ({
    page,
  }) => {
    const created = await createHighlights(
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
    for (const c of created) {
      expect(
        report.marks.some((m) => m.text === c.exact),
        `missing phrase: ${c.phrase}`
      ).toBe(true);
    }
  });

  test("DI-06 marks remain inside paragraph parents", async ({ page }) => {
    await createHighlights(
      page,
      M.threeParagraphPhrases.map((phrase) => ({
        projection: M.id,
        element: M.element,
        phrase,
      }))
    );
    await reloadAndOpenProjection(page, M.tabIndex);
    const parents = await page.evaluate(() => {
      return [...document.querySelectorAll("mark.learner-highlight")].map(
        (m) => m.parentElement?.closest("p")?.tagName || m.parentElement?.tagName
      );
    });
    for (const tag of parents) {
      expect(tag).toBe("P");
    }
  });
});
