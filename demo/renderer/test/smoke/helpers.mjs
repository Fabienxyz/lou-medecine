/** Browser helpers for Renderer V2.1 smoke tests. */

import { CHAPTER_ID, DB_NAME, chapterUrl, projectionByTabIndex } from "./fixtures.mjs";

export { chapterUrl, CHAPTER_ID };

export async function clearLearnerDb(page) {
  await page.goto(chapterUrl());
  await page.evaluate((dbName) => indexedDB.deleteDatabase(dbName), DB_NAME);
  await page.waitForTimeout(150);
  await page.reload({ waitUntil: "networkidle" });
}

export async function goToProjection(page, tabIndex) {
  const projection = projectionByTabIndex(tabIndex);
  await page.locator(".tab").nth(tabIndex).click();
  await page.waitForFunction(
    ({ element, marker }) => {
      const wt = document.querySelector(
        `[data-element="${element}"] .block-walkthrough`
      );
      return (
        wt &&
        wt.dataset.official === "true" &&
        wt.textContent.includes(marker)
      );
    },
    { element: projection.element, marker: projection.contentMarker },
    { timeout: 15_000 }
  );
  await page.waitForFunction(
    () => window.LouTextHighlights?._boundHost?.id === "content"
  );
}

export async function createHighlight(page, opts) {
  const {
    projection,
    element,
    phrase,
    blockSelector = `[data-element="${element}"]`,
  } = opts;
  return page.evaluate(
    async ({ chapter, projection, element, phrase, blockSelector }) => {
      const block = document.querySelector(blockSelector);
      if (!block) throw new Error(`block not found: ${blockSelector}`);
      const wt = block.querySelector(".block-walkthrough");
      if (!wt) throw new Error("walkthrough not found");
      const TH = window.LouTextHighlights;
      const pos = wt.textContent.indexOf(phrase);
      if (pos < 0) throw new Error(`phrase not found: ${phrase}`);
      const range = TH._rangeFromTextOffsets(wt, pos, pos + phrase.length);
      if (!range) throw new Error(`range collapsed for: ${phrase}`);
      const selector = TH.selectorFromRange(wt, range);
      if (!selector?.exact) throw new Error(`selector failed for: ${phrase}`);
      const mark = TH.wrapRangeInMark(range.cloneRange());
      if (!mark) throw new Error(`wrap failed for: ${phrase}`);
      await window.LouLearnerStore.addTextHighlight(
        chapter,
        projection,
        element,
        selector
      );
      return {
        phrase,
        exact: selector.exact,
        text: mark.textContent,
        markHtml: mark.outerHTML.slice(0, 200),
      };
    },
    {
      chapter: CHAPTER_ID,
      projection,
      element,
      phrase,
      blockSelector,
    }
  );
}

export async function createHighlights(page, specs) {
  const results = [];
  for (const spec of specs) {
    results.push(await createHighlight(page, spec));
  }
  return results;
}

export async function reloadAndOpenProjection(page, tabIndex) {
  await page.reload({ waitUntil: "networkidle" });
  await goToProjection(page, tabIndex);
}

/** Reload and wait for the default boot tab (Story) without clicking tabs. */
export async function reloadToDefaultStoryTab(page, storyMarker) {
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(
    ({ marker }) => {
      const wt = document.querySelector(
        '[data-element="MM-pump-decompensation"] .block-walkthrough'
      );
      return (
        wt &&
        wt.dataset.official === "true" &&
        wt.textContent.includes(marker)
      );
    },
    { marker: storyMarker },
    { timeout: 15_000 }
  );
  await page.waitForFunction(
    () => window.LouTextHighlights?._boundHost?.id === "content"
  );
}

export async function listStoredHighlights(page, projection) {
  return page.evaluate(
    async ({ chapter, projection }) => {
      return window.LouLearnerStore.listTextHighlights(chapter, projection);
    },
    { chapter: CHAPTER_ID, projection }
  );
}

export async function countStoredHighlightsAllProjections(page) {
  return page.evaluate(async (chapter) => {
    const db = await window.LouLearnerStore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("text_annotations", "readonly");
      const req = tx.objectStore("text_annotations").getAll();
      req.onsuccess = () => {
        resolve(
          (req.result || []).filter((row) => row.chapter === chapter).length
        );
      };
      req.onerror = () => reject(req.error);
    });
  }, CHAPTER_ID);
}

export async function inspectMarks(page, rootSelector = "#content") {
  return page.evaluate((rootSel) => {
    const root = document.querySelector(rootSel) || document;
    const marks = [...root.querySelectorAll("mark.learner-highlight")];
    const walkthroughs = [...root.querySelectorAll(".block-walkthrough")];
    return {
      markCount: marks.length,
      marks: marks.map((m) => {
        const rect = m.getBoundingClientRect();
        return {
          text: m.textContent,
          textLength: m.textContent.length,
          nested: !!m.querySelector("mark.learner-highlight"),
          emptyTextChild: [...m.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent === ""
          ),
          unexpectedBr: !!m.querySelector("br"),
          parentTag: m.parentElement?.tagName,
          thinVertical:
            rect.width > 0 && rect.width <= 4 && rect.height > 8,
          rect: { width: rect.width, height: rect.height },
        };
      }),
      walkthroughTextLengths: walkthroughs.map((w) => ({
        official: w.dataset.official,
        length: w.textContent.length,
        paragraphCount: w.querySelectorAll("p").length,
      })),
      unexpectedBrInWalkthrough: walkthroughs.some((w) =>
        [...w.querySelectorAll("mark.learner-highlight")].some((m) =>
          m.querySelector("br")
        )
      ),
    };
  }, rootSelector);
}

export function assertHealthyMarks(report, expect) {
  for (const m of report.marks) {
    expect(m.textLength, `empty mark: ${JSON.stringify(m)}`).toBeGreaterThan(0);
    expect(m.nested, `nested mark: ${m.text}`).toBe(false);
    expect(m.emptyTextChild, `empty text node in mark: ${m.text}`).toBe(false);
    expect(m.thinVertical, `thin vertical mark: ${m.text}`).toBe(false);
  }
}

export async function createHighlightViaToolbar(page, opts) {
  const { element, phrase, projectionId } = opts;
  const ui = await runSelectionChange(page, { element, phrase, projectionId });
  if (!ui.ok || !ui.toolbarVisible) {
    throw new Error(
      `toolbar not shown for ${phrase}: ${ui.reason || "no selection context"}`
    );
  }
  await page.locator(".highlight-toolbar-btn").click();
  await page.waitForFunction(
    () =>
      !window.LouTextHighlights._selectionContext &&
      document.querySelector(".highlight-toolbar")?.hidden !== false
  );
  return ui.selectedText;
}

export async function runSelectionChange(page, opts) {
  const { element, phrase, projectionId, blockSelector, selectInQuestion } = opts;
  return page.evaluate(
    ({ element, phrase, projectionId, blockSelector, selectInQuestion }) => {
      window.LouTextHighlights.dismissToolbar();
      const host = document.getElementById("content");
      const block = document.querySelector(
        blockSelector || `[data-element="${element}"]`
      );
      if (!block) return { ok: false, reason: "block missing" };

      let range;
      if (selectInQuestion) {
        const question = block.querySelector(".block-question");
        if (!question) return { ok: false, reason: "question missing" };
        range = document.createRange();
        range.selectNodeContents(question);
      } else if (selectInQuestion === "preamble") {
        const h1 = document.querySelector("#content h1");
        if (!h1) return { ok: false, reason: "h1 missing" };
        range = document.createRange();
        range.selectNodeContents(h1);
      } else if (selectInQuestion === "affordance") {
        const btn = block.querySelector(".note-affordance");
        if (!btn) return { ok: false, reason: "affordance missing" };
        range = document.createRange();
        range.selectNodeContents(btn);
      } else {
        const wt = block.querySelector(".block-walkthrough");
        const pos = wt.textContent.indexOf(phrase);
        if (pos < 0) return { ok: false, reason: "phrase missing" };
        range = document.createRange();
        const walker = document.createTreeWalker(wt, NodeFilter.SHOW_TEXT);
        let node;
        let offset = 0;
        let startNode;
        let startOff;
        let endNode;
        let endOff;
        const endPos = pos + phrase.length;
        while ((node = walker.nextNode())) {
          const len = node.textContent.length;
          const nodeStart = offset;
          const nodeEnd = offset + len;
          if (!startNode && pos < nodeEnd) {
            startNode = node;
            startOff = pos - nodeStart;
          }
          if (endPos > nodeStart && endPos <= nodeEnd) {
            endNode = node;
            endOff = endPos - nodeStart;
            break;
          }
          offset += len;
        }
        if (!startNode || !endNode) return { ok: false, reason: "range nodes" };
        range.setStart(startNode, startOff);
        range.setEnd(endNode, endOff);
      }

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      const context = {
        chapter: "cardio/234",
        projection: { id: projectionId },
        store: window.LouLearnerStore,
      };
      window.LouTextHighlights._onSelectionChange(host, context);

      const toolbar = document.querySelector(".highlight-toolbar");
      return {
        ok: true,
        toolbarVisible: !!(toolbar && !toolbar.hidden),
        hasSelectionContext: !!window.LouTextHighlights._selectionContext,
        selectedText: range.toString().slice(0, 60),
      };
    },
    { element, phrase, projectionId, blockSelector, selectInQuestion }
  );
}

export async function getLifecycleState(page) {
  return page.evaluate(() => ({
    boundHost: window.LouTextHighlights._boundHost?.id || null,
    toolbarCount: document.querySelectorAll(".highlight-toolbar").length,
    markCount: document.querySelectorAll("mark.learner-highlight").length,
  }));
}
