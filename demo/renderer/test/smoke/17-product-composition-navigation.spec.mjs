/** Phase T0 — Composition navigation in product mode (authoritative Reader path). */
import { test, expect } from "@playwright/test";
import {
  openProductChapter,
  resetCatalogOfflineStatus,
} from "./product-helpers.mjs";

const VIEW_LABELS = [
  "Amorçage cognitif",
  "Modèle mental",
  "Notions",
  "Cas cliniques",
  "Collège officiel",
  "QCM",
  "Notes",
];

test.describe("CN-P — composition navigation (product mode)", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page }) => {
    resetCatalogOfflineStatus("not_prepared");
    await openProductChapter(page);
  });

  test("CN-P-01 displays exactly 7 view tabs from Reading View Model", async ({
    page,
  }) => {
    const tabs = page.locator(".tab");
    await expect(tabs).toHaveCount(7);
    const labels = await tabs.allTextContents();
    expect(labels).toEqual(VIEW_LABELS);
  });

  test("CN-P-02 mental-model aggregates story and overview content", async ({
    page,
  }) => {
    await page.locator(".tab", { hasText: "Modèle mental" }).click();
    await page.waitForFunction(() => {
      const wt = document.querySelector(
        '[data-element="MM-pump-decompensation"] .block-walkthrough'
      );
      return wt && wt.textContent.includes("Reprenons la même trajectoire");
    });
    await page.waitForFunction(() => {
      return document.querySelectorAll(".pedagogical-block").length >= 2;
    });
  });

  test("CN-P-03 notions renders mechanisms content", async ({ page }) => {
    await page.locator(".tab", { hasText: "Notions" }).click();
    await page.waitForFunction(() => {
      const wt = document.querySelector(
        '[data-element="MEC-output-basics"] .block-walkthrough'
      );
      return (
        wt &&
        wt.dataset.official === "true" &&
        wt.textContent.includes("débit adapté aux besoins")
      );
    });
  });

  test("CN-P-04 clinical-cases renders reasoning and scenario registry", async ({
    page,
  }) => {
    await page.locator(".tab", { hasText: "Cas cliniques" }).click();
    await page.waitForFunction(() => {
      const wt = document.querySelector(
        '[data-element="CR-recognize"] .block-walkthrough'
      );
      return wt && wt.textContent.includes("dyspnée d'effort");
    });
    await expect(page.locator(".view-scenarios-list li")).toHaveCount(3);
    await expect(page.locator(".footer-nav")).toHaveCount(0);
  });

  test("CN-P-05 qcm lists questions from registry", async ({ page }) => {
    await page.locator(".tab", { hasText: "QCM" }).click();
    await expect(page.locator(".view-qcm-list li").first()).toBeVisible();
    const count = await page.locator(".view-qcm-list li").count();
    expect(count).toBeGreaterThan(0);
  });

  test("CN-P-06 notes shows learner shell only", async ({ page }) => {
    await page.locator(".tab", { hasText: "Notes" }).click();
    await expect(page.locator(".view-notes-shell")).toBeVisible();
    await expect(page.locator(".pedagogical-block")).toHaveCount(0);
  });

  // CN-07 (planned view when artefact absent) — authoritative in dev mode only:
  // product mode serves manifest from offline cache; see 10-composition-navigation CN-07.
});
