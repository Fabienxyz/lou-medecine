import { test, expect } from "@playwright/test";
import { PROJECTIONS } from "./fixtures.mjs";
import {
  clearLearnerDb,
  goToProjection,
  createHighlight,
  createHighlights,
  inspectMarks,
  assertHealthyMarks,
} from "./helpers.mjs";

const M = PROJECTIONS.mechanisms;

test.describe("V2.1 smoke — creation", () => {
  test.beforeEach(async ({ page }) => {
    await clearLearnerDb(page);
    await goToProjection(page, M.tabIndex);
  });

  test("CR-01 one highlight", async ({ page }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
    });
    const report = await inspectMarks(page);
    expect(report.markCount).toBe(1);
    assertHealthyMarks(report, expect);
  });

  test("CR-02 multiple highlights in different paragraphs", async ({ page }) => {
    for (const phrase of M.threeParagraphPhrases) {
      await createHighlight(page, {
        projection: M.id,
        element: M.element,
        phrase,
      });
    }
    const report = await inspectMarks(page);
    expect(report.markCount).toBe(3);
    assertHealthyMarks(report, expect);
  });

  test("CR-03 multiple highlights in same paragraph", async ({ page }) => {
    for (const phrase of M.sameParagraphPhrases) {
      await createHighlight(page, {
        projection: M.id,
        element: M.element,
        phrase,
      });
    }
    const report = await inspectMarks(page);
    expect(report.markCount).toBe(3);
    assertHealthyMarks(report, expect);
  });

  test("CR-04 highlight near beginning of paragraph", async ({ page }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: "Le débit cardiaque",
    });
    const report = await inspectMarks(page);
    expect(report.markCount).toBe(1);
    expect(report.marks[0].text).toContain("Le débit cardiaque");
    assertHealthyMarks(report, expect);
  });

  test("CR-05 highlight near end of paragraph", async ({ page }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: M.threeParagraphPhrases[2],
    });
    const report = await inspectMarks(page);
    expect(report.markCount).toBe(1);
    assertHealthyMarks(report, expect);
  });

  test("CR-06 highlight containing punctuation", async ({ page }) => {
    const S = PROJECTIONS.story;
    await goToProjection(page, S.tabIndex);
    await createHighlight(page, {
      projection: S.id,
      element: S.element,
      phrase: S.punctuationPhrase,
    });
    const report = await inspectMarks(page);
    expect(report.marks[0].text).toBe("et/ou");
    assertHealthyMarks(report, expect);
  });

  test("CR-07 highlight containing accented characters", async ({ page }) => {
    const S = PROJECTIONS.story;
    await goToProjection(page, S.tabIndex);
    await createHighlight(page, {
      projection: S.id,
      element: S.element,
      phrase: S.accentedPhrase,
    });
    const report = await inspectMarks(page);
    expect(report.marks[0].text).toContain("neurohormonale");
    assertHealthyMarks(report, expect);
  });

  test("CR-08 long highlight", async ({ page }) => {
    const S = PROJECTIONS.story;
    await goToProjection(page, S.tabIndex);
    await createHighlight(page, {
      projection: S.id,
      element: S.element,
      phrase: S.longPhrase,
    });
    const report = await inspectMarks(page);
    expect(report.marks[0].textLength).toBeGreaterThan(80);
    assertHealthyMarks(report, expect);
  });

  test("CR-09 short highlight", async ({ page }) => {
    const S = PROJECTIONS.story;
    await goToProjection(page, S.tabIndex);
    await createHighlight(page, {
      projection: S.id,
      element: S.element,
      phrase: S.shortPhrase,
    });
    const report = await inspectMarks(page);
    expect(report.marks[0].textLength).toBe(5);
    assertHealthyMarks(report, expect);
  });

  test("CR-10 highlight in second block same projection", async ({ page }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.oapElement,
      phrase: M.oapPhrase,
    });
    const report = await inspectMarks(
      page,
      `[data-element="${M.oapElement}"]`
    );
    expect(report.markCount).toBe(1);
    assertHealthyMarks(report, expect);
  });
});
