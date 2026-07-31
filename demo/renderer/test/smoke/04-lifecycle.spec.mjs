import { test, expect } from "@playwright/test";
import { PROJECTIONS } from "./fixtures.mjs";
import {
  clearLearnerDb,
  goToProjection,
  createHighlight,
  createHighlights,
  inspectMarks,
  assertHealthyMarks,
  getLifecycleState,
  blockSelectorFor,
} from "./helpers.mjs";

const M = PROJECTIONS.mechanisms;

test.describe("V2.1 smoke — renderer lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await clearLearnerDb(page);
    await goToProjection(page, M.tabIndex);
  });

  test("LC-01 multiple composed view switches via tabs", async ({ page }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
    });
    for (let i = 0; i < 5; i++) {
      await goToProjection(page, PROJECTIONS.story.tabIndex);
      await goToProjection(page, M.tabIndex);
    }
    const report = await inspectMarks(
      page,
      blockSelectorFor(M.id, M.element)
    );
    expect(report.markCount).toBe(1);
    assertHealthyMarks(report, expect);
  });

  test("LC-02 DOM rebuilt on projection switch", async ({ page }) => {
    await goToProjection(page, PROJECTIONS.story.tabIndex);
    const storySnippet = await page.evaluate(() =>
      document
        .querySelector(
          '[data-element="MM-pump-decompensation"] .block-walkthrough'
        )
        ?.textContent?.slice(0, 40)
    );
    await goToProjection(page, M.tabIndex);
    const mechSnippet = await page.evaluate(() =>
      document
        .querySelector(
          '[data-element="MEC-output-basics"] .block-walkthrough'
        )
        ?.textContent?.slice(0, 40)
    );
    expect(storySnippet).not.toBe(mechSnippet);
  });

  test("LC-03 selection binding not duplicated on same host", async ({
    page,
  }) => {
    await goToProjection(page, M.tabIndex);
    await goToProjection(page, PROJECTIONS.story.tabIndex);
    await goToProjection(page, M.tabIndex);
    const state = await getLifecycleState(page);
    expect(state.boundHost).toBe("content");
    expect(state.toolbarCount).toBeLessThanOrEqual(1);
  });

  test("LC-04 restore is idempotent when called twice", async ({ page }) => {
    await createHighlights(
      page,
      M.threeParagraphPhrases.map((phrase) => ({
        projection: M.id,
        element: M.element,
        phrase,
      }))
    );
    await page.evaluate(async () => {
      const host = document.getElementById("content");
      const ctx = {
        chapter: "cardio/234",
        projection: { id: "mechanisms" },
        store: window.LouLearnerStore,
      };
      await window.LouTextHighlights.restore(host, ctx);
      await window.LouTextHighlights.restore(host, ctx);
    });
    const report = await inspectMarks(
      page,
      blockSelectorFor(M.id, M.element)
    );
    expect(report.markCount).toBe(3);
    assertHealthyMarks(report, expect);
  });

  test("LC-05 single mount restore after tab return", async ({ page }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
    });
    await goToProjection(page, PROJECTIONS.overview);
    await goToProjection(page, M);
    const report = await inspectMarks(
      page,
      blockSelectorFor(M.id, M.element)
    );
    expect(report.markCount).toBe(1);
    assertHealthyMarks(report, expect);
  });
});
