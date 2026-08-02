/** Lot D — composition navigation smoke (cardio/234 acceptance fixture). */
import { test, expect } from "@playwright/test";
import { CHAPTER_SLUG, RENDERER_PATH } from "./fixtures.mjs";

const VIEW_LABELS = [
  "Amorçage cognitif",
  "Modèle mental",
  "Notions",
  "Cas cliniques",
  "Collège officiel",
  "QCM",
  "Notes",
];

function chapterUrl() {
  return `${RENDERER_PATH}?chapter=${encodeURIComponent(CHAPTER_SLUG)}`;
}

const CHAPTER_MANIFEST_ROUTE =
  "**/01-learning/chapters/cardio/234/manifest.json";

/** @param {(manifest: Record<string, unknown>) => void} mutator */
async function routeChapterManifest(page, mutator) {
  await page.route(CHAPTER_MANIFEST_ROUTE, async (route) => {
    const response = await route.fetch();
    const manifest = await response.json();
    mutator(manifest);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(manifest),
    });
  });
}

test.describe("Lot D — composition navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(chapterUrl(), { waitUntil: "networkidle" });
  });

  test("CN-01 displays exactly 7 view tabs from Reading View Model", async ({
    page,
  }) => {
    const tabs = page.locator(".tab");
    await expect(tabs).toHaveCount(7);
    const labels = await tabs.allTextContents();
    expect(labels).toEqual(VIEW_LABELS);
  });

  test("CN-02 mental-model aggregates story and overview content", async ({
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
      const blocks = document.querySelectorAll(".pedagogical-block");
      return blocks.length >= 2;
    });
  });

  test("CN-03 notions renders mechanisms content", async ({ page }) => {
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

  test("CN-04 clinical-cases renders reasoning and scenario registry", async ({
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
    const order = await page.evaluate(() => {
      const content = document.getElementById("content");
      const scenarios = content.querySelector(".view-scenarios-shell");
      const footer = content.querySelector(".footer-nav");
      return (
        scenarios &&
        footer &&
        (scenarios.compareDocumentPosition(footer) &
          Node.DOCUMENT_POSITION_FOLLOWING) !==
          0
      );
    });
    expect(order).toBe(true);
  });

  test("CN-05 qcm lists questions from registry", async ({ page }) => {
    await page.locator(".tab", { hasText: "QCM" }).click();
    await expect(page.locator(".view-qcm-list li").first()).toBeVisible();
    const count = await page.locator(".view-qcm-list li").count();
    expect(count).toBeGreaterThan(0);
  });

  test("CN-06 notes shows learner shell only", async ({ page }) => {
    await page.locator(".tab", { hasText: "Notes" }).click();
    await expect(page.locator(".view-notes-shell")).toBeVisible();
    await expect(page.locator(".pedagogical-block")).toHaveCount(0);
  });

  test("CN-07 planned views show explicit status", async ({ page }) => {
    await page.locator(".tab", { hasText: "Amorçage cognitif" }).click();
    await expect(page.locator(".cognitive-priming-body")).toBeVisible();
    await expect(
      page.locator('.tab[data-view-id="cognitive-priming"]')
    ).toHaveAttribute("data-availability", "published");
    await expect(
      page.locator('.content-status[data-state="planned"]')
    ).toHaveCount(0);

    await page.locator(".tab", { hasText: "Collège officiel" }).click();
    await expect(page.locator(".college-official-body")).toBeVisible();
    await expect(
      page.locator('.content-status[data-state="planned"]')
    ).toHaveCount(0);

    await routeChapterManifest(page, (manifest) => {
      delete manifest.cognitive_priming_path;
    });
    await page.goto(chapterUrl(), { waitUntil: "networkidle" });
    await page.locator(".tab", { hasText: "Amorçage cognitif" }).click();
    await expect(
      page.locator('.content-status[data-state="planned"]')
    ).toBeVisible();

    await page.unroute(CHAPTER_MANIFEST_ROUTE);
    await routeChapterManifest(page, (manifest) => {
      delete manifest.college_source_path;
    });
    await page.goto(chapterUrl(), { waitUntil: "networkidle" });
    await page.locator(".tab", { hasText: "Collège officiel" }).click();
    await expect(
      page.locator('.content-status[data-state="planned"]')
    ).toBeVisible();
  });
});
