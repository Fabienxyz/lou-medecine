/**
 * Offline — dev bootstrap engineering checks.
 *
 * Famille : Validation Reader technique (browser, mode développement).
 * Autorité : informative — le chemin produit est couvert par 12-offline-d2g et 16-product-consumption.
 * Référence : docs/testing/TEST_ARCHITECTURE_V1.md
 */
import { test, expect } from "@playwright/test";
import { chapterUrl, CHAPTER_ID } from "./fixtures.mjs";

test.describe("Offline — dev bootstrap (engineering)", () => {
  test("OF-DEV-01 missing college source degrades without crash", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));

    await page.route(`**/chapters/${CHAPTER_ID}/source/official-college.md`, (route) =>
      route.fulfill({ status: 404, body: "missing" })
    );
    await page.goto(chapterUrl(), { waitUntil: "networkidle" });
    await page.locator(".tab").nth(4).click();
    await expect(page.locator("#content .content-status")).toBeVisible({
      timeout: 15_000,
    });
    expect(pageErrors).toEqual([]);
  });
});
