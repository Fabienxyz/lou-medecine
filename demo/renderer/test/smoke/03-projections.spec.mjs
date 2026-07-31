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
    await goToProjection(page, PROJECTIONS.overview);
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
        tab: PROJECTIONS.overview,
        phrase: PROJECTIONS.overview.samplePhrase,
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
    expect(totalStored).toBe(4);

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

  test("PR-06 overview projection walkthrough renders official container", async ({
    page,
  }) => {
    await goToProjection(page, PROJECTIONS.overview);
    await expect(
      page.locator(
        blockSelectorFor(PROJECTIONS.overview.id, PROJECTIONS.overview.element) +
          ' .block-walkthrough[data-official="true"]'
      )
    ).toBeVisible();
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

  test("PR-M01 manual repro — three Story highlights, one Overview, reload, return to Overview", async ({
    page,
  }) => {
    const story = PROJECTIONS.story;
    const overview = PROJECTIONS.overview;

    // 1. Open Modèle mental (story block)
    await goToProjection(page, story);

    // 2. Create three highlights in Story (three different paragraphs)
    for (const phrase of story.threeParagraphPhrases) {
      await createHighlight(page, {
        projection: story.id,
        element: story.element,
        phrase,
      });
    }
    const storyBeforeReload = await inspectMarks(
      page,
      blockSelectorFor(story.id, story.element)
    );
    expect(storyBeforeReload.markCount).toBe(3);

    // 3. Switch to Overview
    await goToProjection(page, overview);

    // 4. Create one highlight in Overview
    await createHighlight(page, {
      projection: overview.id,
      element: overview.element,
      phrase: overview.samplePhrase,
    });
    const overviewBeforeReload = await inspectMarks(
      page,
      blockSelectorFor(overview.id, overview.element)
    );
    expect(overviewBeforeReload.markCount).toBe(1);

    // 5. Reload — 6. renderer opens Story (default tab, no click)
    await reloadToDefaultStoryTab(page, story.contentMarker);

    const storyAfterReload = await inspectMarks(
      page,
      blockSelectorFor(story.id, story.element)
    );
    expect(storyAfterReload.markCount).toBe(3);

    // 7. Switch back to Overview only
    await goToProjection(page, overview);

    const overviewAfterReload = await inspectMarks(
      page,
      blockSelectorFor(overview.id, overview.element)
    );
    const overviewStored = await listStoredHighlights(page, overview.id);

    expect(
      overviewStored.length,
      "Overview highlight row must remain in IndexedDB"
    ).toBe(1);
    expect(
      overviewAfterReload.markCount,
      "Overview highlight must restore after reload when returning from Story"
    ).toBe(1);
    assertHealthyMarks(overviewAfterReload, expect);
    expect(overviewAfterReload.marks[0].text).toContain("physiopathologique");
  });

  test("PR-M01-UI same sequence via selection toolbar (manual workflow)", async ({
    page,
  }) => {
    const story = PROJECTIONS.story;
    const overview = PROJECTIONS.overview;

    await goToProjection(page, story);

    for (const phrase of story.threeParagraphPhrases) {
      await createHighlightViaToolbar(page, {
        element: story.element,
        phrase,
        projectionId: story.id,
      });
    }

    await goToProjection(page, overview);
    await createHighlightViaToolbar(page, {
      element: overview.element,
      phrase: overview.samplePhrase,
      projectionId: overview.id,
    });

    await reloadToDefaultStoryTab(page, story.contentMarker);
    await goToProjection(page, overview);

    const overviewAfterReload = await inspectMarks(
      page,
      blockSelectorFor(overview.id, overview.element)
    );
    const overviewStored = await listStoredHighlights(page, overview.id);

    expect(overviewStored.length).toBe(1);
    expect(overviewAfterReload.markCount).toBe(1);
    assertHealthyMarks(overviewAfterReload, expect);
  });
});
