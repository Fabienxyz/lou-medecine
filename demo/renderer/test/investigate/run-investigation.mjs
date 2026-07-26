/**
 * Highlight pipeline investigation — test-only, no production changes.
 * Run from repo root with: python3 -m http.server 8765
 * Then: node demo/renderer/test/investigate/run-investigation.mjs
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  installTrace,
  exportTrace,
  snap,
  dumpIdb,
} from "./trace-instrumentation.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dir, "output");
const URL =
  "http://127.0.0.1:8765/demo/renderer/index.html?chapter=cardio%2F234-insuffisance-cardiaque";

const STORY_PHRASES = [
  "débit adapté aux besoins",
  "activation neurohormonale",
  "congestion pulmonaire",
];
const OVERVIEW_PHRASE = "Sur le plan physiopathologique";

async function clearDb(page) {
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => indexedDB.deleteDatabase("lou-learner"));
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: "networkidle" });
}

async function waitProjection(page, marker) {
  await page.waitForFunction(
    (m) => {
      const wt = document.querySelector(
        '[data-element="MM-pump-decompensation"] .block-walkthrough'
      );
      return wt?.dataset.official === "true" && wt.textContent.includes(m);
    },
    marker,
    { timeout: 15000 }
  );
}

async function clickTab(page, index) {
  await page.locator(".tab").nth(index).click();
}

async function installTraceOnPage(page) {
  await installTrace(page);
}

async function selectPhraseRealMousePath(page, phrase) {
  const result = await page.evaluate(async (p) => {
    window.LouTextHighlights.dismissToolbar();
    const host = document.getElementById("content");
    const wt = document.querySelector(
      '[data-element="MM-pump-decompensation"] .block-walkthrough'
    );
    if (!wt) return { error: "walkthrough missing" };
    const pos = wt.textContent.indexOf(p);
    if (pos < 0) return { error: "phrase missing", phrase: p, sample: wt.textContent.slice(0, 80) };

    const walker = document.createTreeWalker(wt, NodeFilter.SHOW_TEXT);
    let node,
      offset = 0,
      startNode,
      startOff,
      endNode,
      endOff;
    const endPos = pos + p.length;
    while ((node = walker.nextNode())) {
      const len = node.textContent.length;
      const ns = offset,
        ne = offset + len;
      if (!startNode && pos < ne) {
        startNode = node;
        startOff = pos - ns;
      }
      if (endPos > ns && endPos <= ne) {
        endNode = node;
        endOff = endPos - ns;
        break;
      }
      offset += len;
    }
    const range = document.createRange();
    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // Real production path: mouseup on #content → rAF → _onSelectionChange(host, STALE context)
    host.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window })
    );
    await new Promise((r) => requestAnimationFrame(r));

    const toolbar = document.querySelector(".highlight-toolbar");
    return {
      selectedText: sel.toString(),
      toolbarVisible: !!(toolbar && !toolbar.hidden),
      selectionContextProjection:
        window.LouTextHighlights._selectionContext?.context?.projection?.id || null,
    };
  }, phrase);

  if (result.error) throw new Error(JSON.stringify(result));
  if (!result.toolbarVisible) {
    throw new Error(`toolbar hidden after mouseup path: ${JSON.stringify(result)}`);
  }
  await page.locator(".highlight-toolbar-btn").click();
  await page.waitForTimeout(250);
  return result;
}

/** PR-M01-UI path: programmatic selection + _onSelectionChange + toolbar click */
async function selectPhrasePlaywrightUI(page, phrase, projectionId) {
  await page.evaluate(
    ({ phrase, projectionId }) => {
      window.LouTextHighlights.dismissToolbar();
      const host = document.getElementById("content");
      const wt = document.querySelector(
        '[data-element="MM-pump-decompensation"] .block-walkthrough'
      );
      const pos = wt.textContent.indexOf(phrase);
      const range = document.createRange();
      const walker = document.createTreeWalker(wt, NodeFilter.SHOW_TEXT);
      let node,
        offset = 0,
        startNode,
        startOff,
        endNode,
        endOff;
      const endPos = pos + phrase.length;
      while ((node = walker.nextNode())) {
        const len = node.textContent.length;
        const ns = offset,
          ne = offset + len;
        if (!startNode && pos < ne) {
          startNode = node;
          startOff = pos - ns;
        }
        if (endPos > ns && endPos <= ne) {
          endNode = node;
          endOff = endPos - ns;
          break;
        }
        offset += len;
      }
      range.setStart(startNode, startOff);
      range.setEnd(endNode, endOff);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      window.LouTextHighlights._onSelectionChange(host, {
        chapter: "cardio/234",
        projection: { id: projectionId },
        store: window.LouLearnerStore,
      });
    },
    { phrase, projectionId }
  );
  await page.locator(".highlight-toolbar-btn").click();
  await page.waitForTimeout(200);
}

async function countMarks(page) {
  return page.evaluate(() => ({
    overview: document.querySelectorAll(
      '[data-element="MM-pump-decompensation"] mark.learner-highlight'
    ).length,
    content: document.querySelectorAll("#content mark.learner-highlight").length,
    activeTab: document.querySelector(".tab.active")?.textContent?.trim(),
  }));
}

async function listByProjection(page) {
  return page.evaluate(async () => {
    const chapter = "cardio/234";
    const ids = ["story", "overview", "mechanisms", "clinical-reasoning"];
    const out = {};
    for (const id of ids) {
      out[id] = await window.LouLearnerStore.listTextHighlights(chapter, id);
    }
    return out;
  });
}

function summarizeTrace(trace, name) {
  const fnEvents = trace.events.filter((e) =>
    [
      "bindSelection",
      "mount.enter",
      "restore.enter",
      "restore.exit",
      "selectionchange",
      "highlight.command",
      "addTextHighlight.enter",
      "addTextHighlight.ok",
      "wrapRangeInMark",
    ].includes(e.type)
  );
  return { name, fnEvents, eventCount: trace.events.length };
}

async function runScenario(name, fn) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let result;
  try {
    await clearDb(page);
    await installTrace(page);
    await snap(page, "after-boot");
    result = await fn(page);
    result.trace = await exportTrace(page);
    result.summary = summarizeTrace(result.trace, name);
  } catch (err) {
    result = { error: String(err), stack: err.stack };
    try {
      result.trace = await exportTrace(page);
    } catch (_) {}
  } finally {
    await browser.close();
  }
  return result;
}

// --- Scenario A (manual mouse path) full sequence ---
async function scenarioA(page) {
  const steps = [];
  await waitProjection(page, "Reprenons la même trajectoire");

  for (const phrase of STORY_PHRASES) {
    await selectPhraseRealMousePath(page, phrase);
    steps.push({ step: `story-highlight:${phrase}`, marks: await countMarks(page) });
    await dumpIdb(page, `story-after-${phrase.slice(0, 12)}`);
  }

  await snap(page, "A-after-3-story");
  await page.reload({ waitUntil: "networkidle" });
  await installTraceOnPage(page);
  await waitProjection(page, "Reprenons la même trajectoire");
  steps.push({ step: "after-reload-story", marks: await countMarks(page) });
  await snap(page, "A-after-reload-story");

  await clickTab(page, 1);
  await waitProjection(page, "Le chapitre entier tient dans une chaîne");
  await snap(page, "A-on-overview-before-create");
  await dumpIdb(page, "A-on-overview-before-create");

  await selectPhraseRealMousePath(page, OVERVIEW_PHRASE);
  steps.push({ step: "overview-highlight-created", marks: await countMarks(page) });
  await snap(page, "A-after-overview-create");
  await dumpIdb(page, "A-after-overview-create");

  await page.reload({ waitUntil: "networkidle" });
  await installTraceOnPage(page);
  await waitProjection(page, "Reprenons la même trajectoire");
  steps.push({ step: "after-second-reload-on-story", marks: await countMarks(page) });
  await snap(page, "A-after-second-reload-story");
  await dumpIdb(page, "A-after-second-reload");

  await clickTab(page, 1);
  await waitProjection(page, "Le chapitre entier tient dans une chaîne");
  const finalMarks = await countMarks(page);
  const byProj = await listByProjection(page);
  steps.push({ step: "final-overview", marks: finalMarks, byProj });
  await snap(page, "A-final-overview");

  return {
    steps,
    finalMarks,
    byProj,
    bugReproduced: finalMarks.overview === 0,
  };
}

// --- Scenario A variant: no intermediate reload ---
async function scenarioANoReload(page) {
  await waitProjection(page, "Reprenons la même trajectoire");
  for (const phrase of STORY_PHRASES) {
    await selectPhraseRealMousePath(page, phrase);
  }
  await clickTab(page, 1);
  await waitProjection(page, "Le chapitre entier tient dans une chaîne");
  await selectPhraseRealMousePath(page, OVERVIEW_PHRASE);
  const afterCreate = await countMarks(page);
  await snap(page, "Ano-after-overview-create");

  await clickTab(page, 0);
  await waitProjection(page, "Reprenons la même trajectoire");
  await clickTab(page, 1);
  await waitProjection(page, "Le chapitre entier tient dans une chaîne");
  const afterSwitchBack = await countMarks(page);
  await snap(page, "Ano-after-switch-back");
  const byProj = await listByProjection(page);

  return {
    afterCreate,
    afterSwitchBack,
    byProj,
    bugReproduced: afterSwitchBack.overview === 0,
  };
}

// --- Scenario B: clear, overview first highlight ---
async function scenarioB(page) {
  await clickTab(page, 1);
  await waitProjection(page, "Le chapitre entier tient dans une chaîne");
  await snap(page, "B-on-overview-before");

  const wtBefore = await page.evaluate(() => {
    const wt = document.querySelector(
      '[data-element="MM-pump-decompensation"] .block-walkthrough'
    );
    return {
      textLength: wt.textContent.length,
      hasPhrase: wt.textContent.includes("Sur le plan physiopathologique"),
    };
  });

  await selectPhraseRealMousePath(page, OVERVIEW_PHRASE);

  const after = await page.evaluate(() => {
    const wt = document.querySelector(
      '[data-element="MM-pump-decompensation"] .block-walkthrough'
    );
    const marks = [...wt.querySelectorAll("mark.learner-highlight")];
    return {
      textLength: wt.textContent.length,
      markCount: marks.length,
      marks: marks.map((m) => m.textContent),
      phraseStillInText: wt.textContent.includes("Sur le plan physiopathologique"),
      phraseInMark: marks.some((m) =>
        m.textContent.includes("Sur le plan physiopathologique")
      ),
    };
  });
  await snap(page, "B-after-create");
  const byProj = await listByProjection(page);

  return {
    wtBefore,
    after,
    byProj,
    bugReproduced:
      after.markCount === 0 && !after.phraseStillInText,
  };
}

// --- PR-M01-UI Playwright path ---
async function scenarioPRM01UI(page) {
  await waitProjection(page, "Reprenons la même trajectoire");
  for (const phrase of STORY_PHRASES) {
    await selectPhrasePlaywrightUI(page, phrase, "story");
  }
  await page.reload({ waitUntil: "networkidle" });
  await installTraceOnPage(page);
  await waitProjection(page, "Reprenons la même trajectoire");

  await clickTab(page, 1);
  await waitProjection(page, "Le chapitre entier tient dans une chaîne");
  await selectPhrasePlaywrightUI(page, OVERVIEW_PHRASE, "overview");

  await page.reload({ waitUntil: "networkidle" });
  await installTraceOnPage(page);
  await waitProjection(page, "Reprenons la même trajectoire");
  await clickTab(page, 1);
  await waitProjection(page, "Le chapitre entier tient dans une chaîne");

  const finalMarks = await countMarks(page);
  const byProj = await listByProjection(page);
  await snap(page, "PRM01-final");

  return { finalMarks, byProj, bugReproduced: finalMarks.overview === 0 };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Running Scenario A (manual mouse)...");
  const a = await runScenario("scenarioA", scenarioA);

  console.log("Running Scenario A no-reload...");
  const aNo = await runScenario("scenarioANoReload", scenarioANoReload);

  console.log("Running Scenario B...");
  const b = await runScenario("scenarioB", scenarioB);

  console.log("Running PR-M01-UI...");
  const pr = await runScenario("PR-M01-UI", scenarioPRM01UI);

  const payload = {
    runAt: new Date().toISOString(),
    scenarioA: {
      bugReproduced: a.bugReproduced,
      steps: a.steps,
      finalMarks: a.finalMarks,
      byProj: a.byProj,
      summary: a.summary,
      keyEvents: a.trace?.events?.filter((e) =>
        ["bindSelection", "addTextHighlight.enter", "selectionchange", "restore.rows"].includes(
          e.type
        )
      ),
    },
    scenarioANoReload: {
      bugReproduced: aNo.bugReproduced,
      afterCreate: aNo.afterCreate,
      afterSwitchBack: aNo.afterSwitchBack,
      byProj: aNo.byProj,
      keyEvents: aNo.trace?.events?.filter((e) =>
        ["bindSelection", "addTextHighlight.enter", "selectionchange"].includes(e.type)
      ),
    },
    scenarioB: {
      bugReproduced: b.bugReproduced,
      wtBefore: b.wtBefore,
      after: b.after,
      byProj: b.byProj,
      wrapEvents: b.trace?.events?.filter((e) => e.type === "wrapRangeInMark"),
      keyEvents: b.trace?.events?.filter((e) =>
        ["bindSelection", "addTextHighlight.enter", "selectionchange", "wrapRangeInMark"].includes(
          e.type
        )
      ),
    },
    PRM01UI: {
      bugReproduced: pr.bugReproduced,
      finalMarks: pr.finalMarks,
      byProj: pr.byProj,
      keyEvents: pr.trace?.events?.filter((e) =>
        ["bindSelection", "addTextHighlight.enter", "selectionchange"].includes(e.type)
      ),
    },
  };

  writeFileSync(
    join(OUT_DIR, "investigation-raw.json"),
    JSON.stringify({ payload, full: { a, aNo, b, pr } }, null, 2)
  );

  console.log("\n=== RESULTS ===");
  console.log("Scenario A bug reproduced:", a.bugReproduced);
  console.log("Scenario A no-reload bug reproduced:", aNo.bugReproduced);
  console.log("Scenario B bug reproduced:", b.bugReproduced);
  console.log("PR-M01-UI bug reproduced:", pr.bugReproduced);
  console.log("\nWrote", join(OUT_DIR, "investigation-raw.json"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
