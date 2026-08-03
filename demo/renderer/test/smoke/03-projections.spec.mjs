import { test, expect } from "@playwright/test";
import { PROJECTIONS } from "./fixtures.mjs";
import {
  clearLearnerDb,
  goToProjection,
  createHighlight,
  createHighlightViaToolbar,
  reloadAndOpenProjection,
  reloadToDefaultStoryTab,
  inspectMarks,
  assertHealthyMarks,
  listStoredHighlights,
  countStoredHighlightsAllProjections,
  blockSelectorFor,
} from "./helpers.mjs";

test.describe("V2.1 smoke — projections", () => {
  test.beforeEach(async ({ page }) => {
    await clearLearnerDb(page);
  });

  test("PR-01 highlight scoped to its projection only", async ({ page }) => {
    await goToProjection(page, PROJECTIONS.story.tabIndex);
    await createHighlight(page, {
      projection: PROJECTIONS.story.id,
      element: PROJECTIONS.story.element,
      phrase: PROJECTIONS.story.samplePhrase,
    });
    await goToProjection(page, PROJECTIONS.mechanisms.tabIndex);
    const mechMarks = await inspectMarks(
      page,
      blockSelectorFor(PROJECTIONS.mechanisms.id, PROJECTIONS.mechanisms.element)
    );
    expect(mechMarks.markCount).toBe(0);

    await goToProjection(page, PROJECTIONS.story.tabIndex);
    const storyMarks = await inspectMarks(
      page,
      blockSelectorFor(PROJECTIONS.story.id, PROJECTIONS.story.element)
    );
    expect(storyMarks.markCount).toBe(1);
    assertHealthyMarks(storyMarks, expect);
  });

  test("PR-02 switching projections does not destroy stored highlights", async ({
    page,
  }) => {
    await goToProjection(page, PROJECTIONS.story.tabIndex);
    await createHighlight(page, {
      projection: PROJECTIONS.story.id,
      element: PROJECTIONS.story.element,
      phrase: PROJECTIONS.story.samplePhrase,
    });
    await goToProjection(page, PROJECTIONS.mechanisms);
    await goToProjection(page, PROJECTIONS.clinicalReasoning);
    await goToProjection(page, PROJECTIONS.story);
    const report = await inspectMarks(
      page,
      blockSelectorFor(PROJECTIONS.story.id, PROJECTIONS.story.element)
    );
    expect(report.markCount).toBe(1);
    expect(report.marks[0].text).toContain("débit adapté");
  });

  test("PR-03 rapid projection switching preserves all highlights", async ({
    page,
  }) => {
    const specs = [
      {
        tab: PROJECTIONS.story,
        phrase: PROJECTIONS.story.samplePhrase,
      },
      {
        tab: PROJECTIONS.mechanisms,
        phrase: PROJECTIONS.mechanisms.threeParagraphPhrases[0],
      },
      {
        tab: PROJECTIONS.clinicalReasoning,
        phrase: PROJECTIONS.clinicalReasoning.samplePhrase,
      },
    ];
    for (const { tab, phrase } of specs) {
      await goToProjection(page, tab);
      await createHighlight(page, {
        projection: tab.id,
        element: tab.element,
        phrase,
      });
    }
    for (let round = 0; round < 2; round++) {
      for (const tab of Object.values(PROJECTIONS)) {
        await goToProjection(page, tab);
      }
    }
    const totalStored = await countStoredHighlightsAllProjections(page);
    expect(totalStored).toBe(specs.length);

    for (const tab of Object.values(PROJECTIONS)) {
      await goToProjection(page, tab);
      const report = await inspectMarks(
        page,
        blockSelectorFor(tab.id, tab.element)
      );
      expect(report.markCount).toBe(1);
      assertHealthyMarks(report, expect);
    }
  });

  test("PR-04 reload then verify each projection independently", async ({
    page,
  }) => {
    for (const tab of Object.values(PROJECTIONS)) {
      await goToProjection(page, tab);
      await createHighlight(page, {
        projection: tab.id,
        element: tab.element,
        phrase: tab.samplePhrase,
      });
    }
    await reloadAndOpenProjection(page, PROJECTIONS.story);
    let activeTabIndex = PROJECTIONS.story.tabIndex;
    for (const tab of Object.values(PROJECTIONS)) {
      if (tab.tabIndex !== activeTabIndex) {
        await goToProjection(page, tab);
        activeTabIndex = tab.tabIndex;
      } else if (tab.id !== PROJECTIONS.story.id) {
        await page.waitForFunction(
          ({ blockSelector }) => {
            const block = document.querySelector("#content " + blockSelector);
            return !!(
              block &&
              block.querySelector(".block-walkthrough")?.dataset.official === "true"
            );
          },
          { blockSelector: blockSelectorFor(tab.id, tab.element) }
        );
        await page.evaluate(async () => {
          if (window.LouApp && window.LouApp.whenTabReady) {
            await window.LouApp.whenTabReady();
          }
        });
      }
      const stored = await listStoredHighlights(page, tab.id);
      expect(stored.length).toBe(1);
      const report = await inspectMarks(
        page,
        blockSelectorFor(tab.id, tab.element)
      );
      expect(report.markCount).toBe(1);
      assertHealthyMarks(report, expect);
    }
  });

  test("PR-05 story projection walkthrough renders official container", async ({
    page,
  }) => {
    await goToProjection(page, PROJECTIONS.story.tabIndex);
    const official = page.locator(
      blockSelectorFor(PROJECTIONS.story.id, PROJECTIONS.story.element) +
        ' .block-walkthrough[data-official="true"]'
    );
    await expect(official).toBeVisible();
  });

  test("PR-07 mechanisms projection walkthrough renders official container", async ({
    page,
  }) => {
    await goToProjection(page, PROJECTIONS.mechanisms.tabIndex);
    await expect(
      page.locator(
        `[data-element="${PROJECTIONS.mechanisms.element}"] .block-walkthrough[data-official="true"]`
      )
    ).toBeVisible();
  });

  test("PR-08 clinical-reasoning projection walkthrough renders official container", async ({
    page,
  }) => {
    await goToProjection(page, PROJECTIONS.clinicalReasoning.tabIndex);
    await expect(
      page.locator(
        `[data-element="${PROJECTIONS.clinicalReasoning.element}"] .block-walkthrough[data-official="true"]`
      )
    ).toBeVisible();
  });
});
