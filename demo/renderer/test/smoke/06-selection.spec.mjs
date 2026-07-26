import { test, expect } from "@playwright/test";
import { PROJECTIONS } from "./fixtures.mjs";
import {
  clearLearnerDb,
  goToProjection,
  createHighlight,
  reloadAndOpenProjection,
  runSelectionChange,
} from "./helpers.mjs";

const M = PROJECTIONS.mechanisms;

test.describe("V2.1 smoke — selection", () => {
  test.beforeEach(async ({ page }) => {
    await clearLearnerDb(page);
    await goToProjection(page, M.tabIndex);
  });

  test("SE-01 official walkthrough text shows highlight toolbar", async ({
    page,
  }) => {
    const ui = await runSelectionChange(page, {
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
      projectionId: M.id,
    });
    expect(ui.ok).toBe(true);
    expect(ui.toolbarVisible).toBe(true);
  });

  test("SE-02 block question title cannot be highlighted", async ({ page }) => {
    const ui = await runSelectionChange(page, {
      element: M.element,
      projectionId: M.id,
      selectInQuestion: true,
    });
    expect(ui.ok).toBe(true);
    expect(ui.toolbarVisible).toBe(false);
  });

  test("SE-03 preamble h1 cannot be highlighted", async ({ page }) => {
    const ui = await runSelectionChange(page, {
      element: M.element,
      projectionId: M.id,
      selectInQuestion: "preamble",
    });
    expect(ui.ok).toBe(true);
    expect(ui.toolbarVisible).toBe(false);
  });

  test("SE-04 selection inside existing highlight is rejected", async ({
    page,
  }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
    });
    const ui = await runSelectionChange(page, {
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
      projectionId: M.id,
    });
    expect(ui.ok).toBe(true);
    expect(ui.toolbarVisible).toBe(false);
  });

  test("SE-05 selection works after reload", async ({ page }) => {
    await createHighlight(page, {
      projection: M.id,
      element: M.element,
      phrase: M.threeParagraphPhrases[1],
    });
    await reloadAndOpenProjection(page, M.tabIndex);
    const ui = await runSelectionChange(page, {
      element: M.element,
      phrase: M.threeParagraphPhrases[2],
      projectionId: M.id,
    });
    expect(ui.ok).toBe(true);
    expect(ui.toolbarVisible).toBe(true);
  });

  test("SE-06 selection works after projection change", async ({ page }) => {
    await goToProjection(page, PROJECTIONS.story.tabIndex);
    await goToProjection(page, M.tabIndex);
    const ui = await runSelectionChange(page, {
      element: M.element,
      phrase: M.threeParagraphPhrases[0],
      projectionId: M.id,
    });
    expect(ui.ok).toBe(true);
    expect(ui.toolbarVisible).toBe(true);
  });

  test("SE-07 note affordance button text is not highlightable", async ({
    page,
  }) => {
    const ui = await runSelectionChange(page, {
      element: M.oapElement,
      projectionId: M.id,
      selectInQuestion: "affordance",
    });
    if (!ui.ok && ui.reason === "affordance missing") {
      test.skip();
      return;
    }
    expect(ui.ok).toBe(true);
    expect(ui.toolbarVisible).toBe(false);
  });
});
