import { test, expect } from "@playwright/test";
import { PROJECTIONS } from "./fixtures.mjs";
import {
  clearLearnerDb,
  goToOapFigure,
  captureOfficialSvgBaseline,
  selectSvgOfficialText,
  listStoredSvgFormats,
  inspectSvgFormatOverlay,
  assertOfficialBaselineUnchanged,
} from "./helpers.mjs";

const M = PROJECTIONS.mechanisms;
const OAP = M.oapElement;

test.describe("V2.3 smoke — SVG inline formatting", () => {
  test.beforeEach(async ({ page }) => {
    await clearLearnerDb(page);
    await goToOapFigure(page, M.tabIndex);
  });

  test("SF-01 backgroundColor cycle with persistence, restore and remove", async ({
    page,
  }) => {
    const baseline = await captureOfficialSvgBaseline(page, OAP);
    expect(baseline).not.toBeNull();

    const selection = await selectSvgOfficialText(page, {
      elementId: OAP,
      phrase: M.oapPhrase,
    });
    expect(selection.ok).toBe(true);
    expect(selection.toolbarVisible).toBe(true);

    await page.locator(".svg-format-toolbar-swatch-bg").first().click();
    await page.waitForFunction(
      ({ elementId }) => {
        const group = document.querySelector(
          `.official-visual[data-element="${elementId}"] g.learner-svg-formats[data-learner="true"]`
        );
        return group && group.querySelector("[data-format-id]");
      },
      { elementId: OAP }
    );

    const applied = await inspectSvgFormatOverlay(page, OAP);
    expect(applied.hasGroup).toBe(true);
    expect(applied.formatIdCount).toBeGreaterThan(0);
    expect(applied.undefinedIds).toBe(0);
    expect(applied.hasNativeSvgMeasureApis).toBe(true);
    expect(applied.looksLikeJsdoomFallback).toBe(false);
    expect(applied.rectMetrics).not.toBeNull();
    expect(Number.isFinite(applied.rectMetrics.x)).toBe(true);
    expect(Number.isFinite(applied.rectMetrics.y)).toBe(true);
    expect(applied.rectMetrics.width).toBeGreaterThan(0);
    expect(applied.rectMetrics.height).toBeGreaterThan(0);

    const storedAfterApply = await listStoredSvgFormats(page, M.id, OAP);
    expect(storedAfterApply.length).toBe(1);
    expect(storedAfterApply[0].format).toBe("backgroundColor");
    expect(storedAfterApply[0].id).toBe(Number(applied.rectMetrics.formatId));

    const afterApplyBaseline = await captureOfficialSvgBaseline(page, OAP);
    assertOfficialBaselineUnchanged(baseline, afterApplyBaseline, expect);
    expect(afterApplyBaseline.learnerInsideSvg).toBeGreaterThan(0);
    expect(applied.learnerOnlyInsideGroup).toBe(true);

    await page.reload({ waitUntil: "networkidle" });
    await goToOapFigure(page, M.tabIndex);

    const restored = await inspectSvgFormatOverlay(page, OAP);
    expect(restored.formatIdCount).toBeGreaterThan(0);
    expect(restored.rectMetrics.width).toBeGreaterThan(0);
    expect(restored.looksLikeJsdoomFallback).toBe(false);

    const storedAfterReload = await listStoredSvgFormats(page, M.id, OAP);
    expect(storedAfterReload.length).toBe(1);

    const afterReloadBaseline = await captureOfficialSvgBaseline(page, OAP);
    assertOfficialBaselineUnchanged(baseline, afterReloadBaseline, expect);

    const removeSelection = await selectSvgOfficialText(page, {
      elementId: OAP,
      phrase: M.oapPhrase,
    });
    expect(removeSelection.toolbarVisible).toBe(true);
    await page.locator('.svg-format-toolbar-btn[data-format="remove"]').click();
    await page.waitForFunction(
      ({ elementId }) => {
        const group = document.querySelector(
          `.official-visual[data-element="${elementId}"] g.learner-svg-formats[data-learner="true"]`
        );
        return !group || !group.querySelector("[data-format-id]");
      },
      { elementId: OAP }
    );

    expect((await listStoredSvgFormats(page, M.id, OAP)).length).toBe(0);
    expect((await inspectSvgFormatOverlay(page, OAP)).formatIdCount).toBe(0);

    const afterRemoveBaseline = await captureOfficialSvgBaseline(page, OAP);
    assertOfficialBaselineUnchanged(baseline, afterRemoveBaseline, expect);

    await page.reload({ waitUntil: "networkidle" });
    await goToOapFigure(page, M.tabIndex);
    expect((await listStoredSvgFormats(page, M.id, OAP)).length).toBe(0);
    expect((await inspectSvgFormatOverlay(page, OAP)).formatIdCount).toBe(0);

    const afterSecondReloadBaseline = await captureOfficialSvgBaseline(page, OAP);
    assertOfficialBaselineUnchanged(baseline, afterSecondReloadBaseline, expect);
  });

  test("SF-02 bold overlay uses native SVG measurement", async ({ page }) => {
    const baseline = await captureOfficialSvgBaseline(page, OAP);

    const selection = await selectSvgOfficialText(page, {
      elementId: OAP,
      phrase: M.oapBoldPhrase,
    });
    expect(selection.ok).toBe(true);
    expect(selection.toolbarVisible).toBe(true);

    await page.locator('.svg-format-toolbar-btn[data-format="bold"]').click();
    await page.waitForFunction(
      ({ elementId }) => {
        const group = document.querySelector(
          `.official-visual[data-element="${elementId}"] g.learner-svg-formats[data-learner="true"]`
        );
        return (
          group &&
          group.querySelector(
            "text[data-learner='true'][font-weight='bold'], tspan[data-learner='true'][font-weight='bold']"
          )
        );
      },
      { elementId: OAP }
    );

    const overlay = await inspectSvgFormatOverlay(page, OAP);
    expect(overlay.boldOverlays.length).toBeGreaterThan(0);
    expect(overlay.boldOverlays[0].formatId).toBeTruthy();
    expect(overlay.undefinedIds).toBe(0);
    expect(overlay.hasNativeSvgMeasureApis).toBe(true);

    const stored = await listStoredSvgFormats(page, M.id, OAP);
    expect(stored.length).toBe(1);
    expect(stored[0].format).toBe("bold");

    assertOfficialBaselineUnchanged(
      baseline,
      await captureOfficialSvgBaseline(page, OAP),
      expect
    );
  });
});
