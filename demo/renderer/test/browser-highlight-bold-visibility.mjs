/**
 * Chromium smoke: highlight bold visibility — computed style + legacy dual flags.
 * Requires: python3 -m http.server 8765 (from repo root)
 * Run: node test/browser-highlight-bold-visibility.mjs
 */
import { chromium } from "playwright";

const BASE =
    "http://127.0.0.1:8765/demo/renderer/index.html?chapter=cardio/234-insuffisance-cardiaque&tab=mechanisms";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve) => {
        const req = indexedDB.deleteDatabase("lou-learner");
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
    });
});
await page.reload({ waitUntil: "networkidle" });
await page.locator(".tab").nth(2).click();
await page.waitForSelector('[data-element="MEC-output-basics"] .block-walkthrough p');

async function runScenario(theme, colorId, hostSelector, phrase) {
    await page.evaluate((t) => {
        document.documentElement.dataset.dpTheme = t;
    }, theme);

    return page.evaluate(
        async ({ hostSelector, phrase, colorId, theme }) => {
            const host = document.querySelector(hostSelector);
            const TH = window.LouTextHighlights;
            const C = window.LouAnnotationColors;
            const tb = () => window.LouAnnotationController.getToolbar();

            function weight(el) {
                return window.getComputedStyle(el).fontWeight;
            }

            function deco(el) {
                return window.getComputedStyle(el).textDecorationLine;
            }

            function click(sel) {
                tb().element.querySelector(sel).click();
            }

            C.setLastHighlightPreferences({
                colorId,
                bold: false,
                underline: false,
                strikethrough: false,
            });

            const wt = host.querySelector(".block-walkthrough");
            if (!host || !wt) {
                throw new Error(`host/walkthrough missing for ${hostSelector}`);
            }
            const pos = wt.textContent.indexOf(phrase);
            const range = TH._rangeFromTextOffsets(wt, pos, pos + phrase.length);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            TH._onSelectionChange(host, TH._bindContext);
            await new Promise((r) => setTimeout(r, 30));

            const mark = host.querySelector("mark.learner-highlight");
            const steps = [];

            steps.push({
                step: "normal",
                weight: weight(mark),
                deco: deco(mark),
                boldDataset: mark.dataset.highlightBold,
            });

            click(".annotation-toolbar-format-bold");
            steps.push({
                step: "bold",
                weight: weight(mark),
                deco: deco(mark),
                inline: mark.style.fontWeight,
                boldDataset: mark.dataset.highlightBold,
            });

            click(".annotation-toolbar-format-underline");
            steps.push({
                step: "underline",
                weight: weight(mark),
                deco: deco(mark),
            });

            click(".annotation-toolbar-format-bold");
            steps.push({
                step: "bold-after-underline",
                weight: weight(mark),
                deco: deco(mark),
                inline: mark.style.fontWeight,
            });

            click(".annotation-toolbar-format-strikethrough");
            steps.push({
                step: "strikethrough",
                weight: weight(mark),
                deco: deco(mark),
            });

            click(".annotation-toolbar-format-bold");
            steps.push({
                step: "bold-after-strike",
                weight: weight(mark),
                deco: deco(mark),
                inline: mark.style.fontWeight,
            });

            const selector = TH.selectorFromRange(wt, range);
            const id = await window.LouLearnerStore.addTextHighlight(
                "cardio/234",
                "mechanisms",
                host.closest("[data-element]").dataset.element,
                selector
            );
            C.setRecordStyle("highlight", id, {
                bold: true,
                underline: false,
                strikethrough: false,
            });
            C.setRecordColor("highlight", id, colorId);
            TH.dismissToolbar();

            return {
                theme,
                colorId,
                hostSelector,
                phrase,
                steps,
                reloadId: id,
                selector,
                element: host.closest("[data-element]").dataset.element,
            };
        },
        { hostSelector, phrase, colorId, theme }
    );
}

const scenarios = [
    {
        theme: "light",
        colorId: "yellow",
        hostSelector: '[data-element="MEC-output-basics"]',
        phrase: "Commence",
    },
    {
        theme: "light",
        colorId: "black",
        hostSelector: '[data-element="MEC-output-basics"]',
        phrase: "débit",
    },
    {
        theme: "dark",
        colorId: "yellow",
        hostSelector: '[data-element="MEC-output-basics"]',
        phrase: "besoins",
    },
    {
        theme: "dark",
        colorId: "black",
        hostSelector: '[data-element="MEC-output-basics"]',
        phrase: "organisme",
    },
];

const results = [];
for (const scenario of scenarios) {
    results.push(await runScenario(
        scenario.theme,
        scenario.colorId,
        scenario.hostSelector,
        scenario.phrase
    ));
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".tab").nth(2).click();
    await page.waitForSelector('[data-element="MEC-output-basics"] .block-walkthrough p');
    await page.evaluate(async () => {
        localStorage.clear();
        await new Promise((resolve) => {
            const req = indexedDB.deleteDatabase("lou-learner");
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".tab").nth(2).click();
    await page.waitForSelector('[data-element="MEC-output-basics"] .block-walkthrough p');
}

await page.goto(BASE, { waitUntil: "networkidle" });
await page.locator(".tab").nth(2).click();
await page.waitForSelector('[data-element="MEC-output-basics"] .block-walkthrough p');

const reloadCheck = await page.evaluate(async () => {
    const host = document.querySelector('[data-element="MEC-output-basics"]');
    const wt = host.querySelector(".block-walkthrough");
    const TH = window.LouTextHighlights;
    const C = window.LouAnnotationColors;
    const phrase = "physiopathologique";
    const pos = wt.textContent.indexOf(phrase);
    const range = TH._rangeFromTextOffsets(wt, pos, pos + phrase.length);
    const selector = TH.selectorFromRange(wt, range);
    C.setRecordColor("highlight", 999, "yellow");
    C.setRecordStyle("highlight", 999, {
        bold: true,
        underline: false,
        strikethrough: false,
    });
    await window.LouLearnerStore.addTextHighlight(
        "cardio/234",
        "mechanisms",
        "MEC-output-basics",
        selector
    );
    await TH.restore(document.getElementById("content"), {
        chapter: "cardio/234",
        projection: { id: "mechanisms" },
        store: {
            listTextHighlights: async () => [
                {
                    id: 999,
                    element: "MEC-output-basics",
                    projection: "mechanisms",
                    selector,
                },
            ],
        },
    });
    const mark = host.querySelector("mark.learner-highlight");
    return {
        inline: mark.style.fontWeight,
        computed: window.getComputedStyle(mark).fontWeight,
        boldDataset: mark.dataset.highlightBold,
    };
});

const legacy = await page.evaluate(() => {
    const mark = document.createElement("mark");
    mark.className = "learner-highlight";
    mark.dataset.highlightBold = "true";
    mark.dataset.highlightUnderline = "true";
    mark.dataset.highlightStrikethrough = "false";
    mark.textContent = "legacy";
    document.body.appendChild(mark);
    const weight = window.getComputedStyle(mark).fontWeight;
    mark.remove();
    return weight;
});

await page.goto(BASE, { waitUntil: "networkidle" });
await page.locator(".tab").nth(2).click();
await page.waitForSelector('[data-element="MEC-output-basics"] .block-question');

const h2Scenario = await page.evaluate(async () => {
    document.documentElement.dataset.dpTheme = "light";
    window.LouAnnotationColors.setLastHighlightPreferences({
        colorId: "yellow",
        bold: false,
        underline: false,
        strikethrough: false,
    });
    const block = document.querySelector('[data-element="MEC-output-basics"]');
    const h2 = block.querySelector(".block-question");
    const TH = window.LouTextHighlights;
    const range = document.createRange();
    range.selectNodeContents(h2);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    TH._onSelectionChange(document.getElementById("content"), TH._bindContext);
    await new Promise((r) => setTimeout(r, 50));
    const mark = block.querySelector("mark.learner-highlight");
    window.LouAnnotationController.getToolbar()
        .element.querySelector(".annotation-toolbar-format-bold")
        .click();
    return {
        weight: window.getComputedStyle(mark).fontWeight,
        inline: mark.style.fontWeight,
        boldDataset: mark.dataset.highlightBold,
    };
});

function assertScenario(s) {
    const boldSteps = s.steps.filter((x) => x.step.startsWith("bold"));
    for (const step of boldSteps) {
        if (step.weight !== "700" && step.weight !== "bold") {
            return false;
        }
        if (step.deco !== "none") {
            return false;
        }
    }
    const underline = s.steps.find((x) => x.step === "underline");
    if (!underline || underline.deco !== "underline" || underline.weight === "700") {
        return false;
    }
    return true;
}

function isBoldWeight(weight) {
    return weight === "700" || weight === "bold";
}

const ok =
    isBoldWeight(legacy) &&
    results.every(assertScenario) &&
    isBoldWeight(h2Scenario.weight) &&
    h2Scenario.inline === "700" &&
    isBoldWeight(reloadCheck.computed) &&
    reloadCheck.inline === "700" &&
    reloadCheck.boldDataset === "true";

console.log(
    JSON.stringify(
        {
            ok,
            legacyDualFlagWeight: legacy,
            reloadCheck,
            h2Scenario,
            scenarios: results.map((r) => ({
                theme: r.theme,
                colorId: r.colorId,
                phrase: r.phrase,
                steps: r.steps,
            })),
        },
        null,
        2
    )
);

await browser.close();
process.exit(ok ? 0 : 1);
