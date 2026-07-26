import { test, expect } from "@playwright/test";
import { PROJECTIONS } from "./fixtures.mjs";
import {
  clearLearnerDb,
  goToProjection,
  createHighlight,
  createHighlights,
  reloadAndOpenProjection,
  inspectMarks,
  assertHealthyMarks,
} from "./helpers.mjs";

const M = PROJECTIONS.mechanisms;

test.describe("V2.1 smoke — robustness", () => {
  test.beforeEach(async ({ page }) => {
    await clearLearnerDb(page);
    await goToProjection(page, M.tabIndex);
  });

  test("RO-01 rapid highlight creation in sequence", async ({ page }) => {
    const phrases = [
      M.threeParagraphPhrases[0],
      M.threeParagraphPhrases[1],
      M.threeParagraphPhrases[2],
      M.sameParagraphPhrases[0],
      M.sameParagraphPhrases[2],
    ];
    for (const phrase of phrases) {
      await createHighlight(page, {
        projection: M.id,
        element: M.element,
        phrase,
      });
    }
    const report = await inspectMarks(
      page,
      `[data-element="${M.element}"]`
    );
    expect(report.markCount).toBe(phrases.length);
    assertHealthyMarks(report, expect);
  });

  test("RO-02 many highlights across blocks then reload", async ({ page }) => {
    const specs = [
      { element: M.element, phrase: M.threeParagraphPhrases[0] },
      { element: M.element, phrase: M.threeParagraphPhrases[1] },
      { element: M.element, phrase: M.threeParagraphPhrases[2] },
      { element: M.oapElement, phrase: M.oapPhrase },
      {
        element: M.congestionElement,
        phrase: M.congestionPhrase,
      },
    ];
    for (const spec of specs) {
      await createHighlight(page, { projection: M.id, ...spec });
    }
    await reloadAndOpenProjection(page, M.tabIndex);
    const report = await inspectMarks(page);
    expect(report.markCount).toBe(specs.length);
    assertHealthyMarks(report, expect);
  });

  test("RO-03 long study session simulation", async ({ page }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
    });
    for (const tab of Object.values(PROJECTIONS)) {
      await goToProjection(page, tab.tabIndex);
      if (tab.id === M.id) continue;
      await createHighlight(page, {
        projection: tab.id,
        element: tab.element,
        phrase: tab.samplePhrase,
      });
    }
    for (let cycle = 0; cycle < 2; cycle++) {
      await reloadAndOpenProjection(page, PROJECTIONS.story.tabIndex);
      for (const tab of Object.values(PROJECTIONS)) {
        await goToProjection(page, tab.tabIndex);
        const report = await inspectMarks(page);
        expect(report.markCount).toBe(1);
        assertHealthyMarks(report, expect);
      }
    }
  });
});
