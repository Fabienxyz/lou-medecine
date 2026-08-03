/** Browser helpers for Renderer V2.1 smoke tests. */

import fs from "node:fs";
import { CHAPTER_ID, DB_NAME, chapterUrl, projectionByTabIndex } from "./fixtures.mjs";

export { chapterUrl, CHAPTER_ID };

export async function clearLearnerDb(page) {
  await page.goto(chapterUrl());
  await page.evaluate((dbName) => indexedDB.deleteDatabase(dbName), DB_NAME);
  await page.waitForTimeout(150);
  await page.reload({ waitUntil: "networkidle" });
}

export async function goToProjection(page, tabIndexOrFixture) {
  const projection =
    typeof tabIndexOrFixture === "object" && tabIndexOrFixture !== null
      ? tabIndexOrFixture
      : projectionByTabIndex(tabIndexOrFixture);
  if (!projection) {
    throw new Error(`No projection fixture for tab index ${tabIndexOrFixture}`);
  }
  await page.locator(".tab").nth(projection.tabIndex).click();
  await page.waitForFunction(
    ({ element, marker, projectionId }) => {
      const sel = projectionId
        ? `.pedagogical-block[data-element="${element}"][data-source-projection="${projectionId}"]`
        : `.pedagogical-block[data-element="${element}"]`;
      const block = document.querySelector("#content " + sel);
      if (!block) {
        return false;
      }
      const wt = block.querySelector(".block-walkthrough");
      return (
        wt &&
        wt.dataset.official === "true" &&
        wt.textContent.includes(marker)
      );
    },
    {
      element: projection.element,
      marker: projection.contentMarker,
      projectionId: projection.id || projection.projection,
    },
    { timeout: 15_000 }
  );
  await page.waitForFunction(
    () => window.LouTextHighlights?._boundHost?.id === "content"
  );
  await page.evaluate(async () => {
    if (window.LouApp && window.LouApp.whenTabReady) {
      await window.LouApp.whenTabReady();
    }
  });
}

export function blockSelectorFor(projection, element) {
  const base = `.pedagogical-block[data-element="${element}"]`;
  if (projection) {
    return `${base}[data-source-projection="${projection}"]`;
  }
  return base;
}

export async function createHighlight(page, opts) {
  const {
    projection,
    element,
    phrase,
    blockSelector = blockSelectorFor(projection, element),
  } = opts;
  return page.evaluate(
    async ({ chapter, projection, element, phrase, blockSelector }) => {
      const content = document.getElementById("content");
      const block = content ? content.querySelector(blockSelector) : null;
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

export async function reloadAndOpenProjection(page, tabIndexOrFixture) {
  await page.reload({ waitUntil: "networkidle" });
  await goToProjection(page, tabIndexOrFixture);
}

/** Reload and wait for the default boot tab (Amorçage) then open Modèle mental. */
export async function reloadToDefaultStoryTab(page, storyMarker) {
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".tab", { hasText: "Modèle mental" }).click();
  await page.waitForFunction(
    ({ marker }) => {
      const block = document.querySelector(
        '[data-element="MM-pump-decompensation"][data-source-projection="story"]'
      );
      const wt = block && block.querySelector(".block-walkthrough");
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
    const content = document.getElementById("content");
    if (!content) {
      return { markCount: 0, marks: [], walkthroughTextLengths: [], unexpectedBrInWalkthrough: false };
    }
    const root =
      !rootSel || rootSel === "#content"
        ? content
        : content.querySelector(rootSel);
    if (!root) {
      return { markCount: 0, marks: [], walkthroughTextLengths: [], unexpectedBrInWalkthrough: false };
    }
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
  const ui = await runSelectionChange(page, {
    element,
    phrase,
    projectionId,
    blockSelector: blockSelectorFor(projectionId, element),
  });
  if (!ui.ok || !ui.toolbarVisible) {
    throw new Error(
      `toolbar not shown for ${phrase}: ${ui.reason || "no selection context"}`
    );
  }
  await page.locator(".annotation-toolbar-swatch").first().click();
  await page.waitForFunction(
    () =>
      !window.LouTextHighlights._selectionContext &&
      (document.querySelector(".annotation-toolbar")?.hidden !== false)
  );
  await page.waitForFunction(
    ({ blockSelector }) => {
      const block = document.querySelector("#content " + blockSelector);
      return !!(block && block.querySelector("mark.learner-highlight"));
    },
    { blockSelector: blockSelectorFor(projectionId, element) }
  );
  return ui.selectedText;
}

export async function runSelectionChange(page, opts) {
  const { element, phrase, projectionId, blockSelector, selectInQuestion } = opts;
  return page.evaluate(
    ({ element, phrase, projectionId, blockSelector, selectInQuestion }) => {
      window.LouTextHighlights.dismissToolbar();
      const host = document.getElementById("content");
      const block = host
        ? host.querySelector(
            blockSelector || `.pedagogical-block[data-element="${element}"]`
          )
        : null;
      if (!block) return { ok: false, reason: "block missing" };

      let range;
      if (selectInQuestion === "preamble") {
        const h1Candidates = [...document.querySelectorAll("#content h1")].filter(
          (heading) => !heading.closest('[data-official="true"]')
        );
        const h1 = h1Candidates[0] || null;
        if (!h1) return { ok: false, reason: "non-official h1 missing" };
        range = document.createRange();
        range.selectNodeContents(h1);
      } else if (selectInQuestion === "affordance") {
        const btn = block.querySelector(".note-affordance, .learner-affordance");
        if (!btn) return { ok: false, reason: "affordance missing" };
        range = document.createRange();
        range.selectNodeContents(btn);
      } else if (selectInQuestion) {
        const question = block.querySelector(".block-question");
        if (!question) return { ok: false, reason: "question missing" };
        range = document.createRange();
        range.selectNodeContents(question);
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

      const context = window.LouTextHighlights._bindContext || {
        chapter: "cardio/234",
        projection: projectionId ? { id: projectionId } : null,
        store: window.LouLearnerStore,
      };
      window.LouTextHighlights._onSelectionChange(host, context);

      const toolbar = document.querySelector(".annotation-toolbar");
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
    toolbarCount: document.querySelectorAll(".annotation-toolbar").length,
    markCount: document.querySelectorAll("mark.learner-highlight").length,
  }));
}

/** V2.3 — inline SVG formatting smoke helpers */

export async function routeOapFormattingSvg(page, fixturePath) {
  const body = fs.readFileSync(fixturePath, "utf8");
  await page.route(/mec-oap\.svg(\?.*)?$/i, (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml; charset=utf-8",
      body,
    })
  );
}

export async function goToOapFigure(page, tabIndex) {
  await goToProjection(page, tabIndex);
  const element = "MEC-oap";
  const figureSel = `.official-visual[data-element="${element}"]`;
  await page.locator(figureSel).scrollIntoViewIfNeeded();
  await page.waitForSelector(`${figureSel} svg[data-inline-ready="true"]`, {
    timeout: 15_000,
  });
  await page.waitForFunction(() => {
    const figure = document.querySelector(
      '.official-visual[data-element="MEC-oap"]'
    );
    return (
      figure &&
      !figure.dataset.inlineFallback &&
      figure.querySelector('svg[data-inline-ready="true"]')
    );
  });
  await page.waitForFunction(
    () => window.LouInlineFormatting?._boundHost?.id === "content"
  );
}

export async function captureOfficialSvgBaseline(page, elementId) {
  return page.evaluate((element) => {
    const svg = document.querySelector(
      `.official-visual[data-element="${element}"] svg[data-inline-ready="true"]`
    );
    if (!svg) {
      return null;
    }
    const officials = [
      ...svg.querySelectorAll(
        'text[data-official-text-id], tspan[data-official-text-id]'
      ),
    ];
    return {
      officials: officials.map((node) => ({
        id: node.getAttribute("data-official-text-id"),
        textContent: node.textContent,
        attrs: Array.from(node.attributes)
          .filter((attr) => !attr.name.startsWith("data-learner"))
          .map((attr) => [attr.name, attr.value])
          .sort(),
      })),
      learnerInsideSvg: svg.querySelectorAll('[data-learner="true"]').length,
    };
  }, elementId);
}

export async function selectSvgOfficialText(page, opts) {
  const { elementId, phrase } = opts;
  return page.evaluate(
    ({ elementId, phrase }) => {
      const host = document.getElementById("content");
      const figure = document.querySelector(
        `.official-visual[data-element="${elementId}"]`
      );
      const svg = figure?.querySelector('svg[data-inline-ready="true"]');
      if (!svg) {
        return { ok: false, reason: "svg not ready" };
      }
      const context = window.LouInlineFormatting._bindContext;
      if (!context) {
        return { ok: false, reason: "formatting context missing" };
      }

      const walker = document.createTreeWalker(
        svg,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (parent.closest('[data-learner="true"]')) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest("textPath")) {
              return NodeFilter.FILTER_REJECT;
            }
            const official = parent.closest(
              "text[data-official-text-id], tspan[data-official-text-id]"
            );
            return official
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          },
        }
      );

      let node = walker.nextNode();
      while (node) {
        const text = node.textContent;
        const idx = text.indexOf(phrase);
        if (idx >= 0) {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + phrase.length);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          window.LouInlineFormatting._onSelectionChange(host, context);
          const toolbar = document.querySelector(".svg-format-toolbar");
          return {
            ok: true,
            selectedText: range.toString(),
            toolbarVisible: !!(toolbar && !toolbar.hidden),
            hasSelectionContext: !!window.LouInlineFormatting._selectionContext,
          };
        }
        node = walker.nextNode();
      }
      return { ok: false, reason: "phrase not found" };
    },
    { elementId, phrase }
  );
}

export async function listStoredSvgFormats(page, projection, element) {
  return page.evaluate(
    async ({ chapter, projection, element }) => {
      return window.LouLearnerStore.listSvgTextFormats(
        chapter,
        projection,
        element
      );
    },
    { chapter: CHAPTER_ID, projection, element }
  );
}

export async function inspectSvgFormatOverlay(page, elementId) {
  return page.evaluate((element) => {
    const svg = document.querySelector(
      `.official-visual[data-element="${element}"] svg[data-inline-ready="true"]`
    );
    const group = svg?.querySelector("g.learner-svg-formats[data-learner='true']");
    const rects = group
      ? [...group.querySelectorAll("rect[data-learner='true']")]
      : [];
    const texts = group
      ? [...group.querySelectorAll("text[data-learner='true'], tspan[data-learner='true']")]
      : [];
    const official = svg?.querySelector('[data-official-text-id="mec-oap-ppc-body"]');
    const rect = rects[0] || null;
    const rectMetrics = rect
      ? {
          x: Number.parseFloat(rect.getAttribute("x")),
          y: Number.parseFloat(rect.getAttribute("y")),
          width: Number.parseFloat(rect.getAttribute("width")),
          height: Number.parseFloat(rect.getAttribute("height")),
          formatId: rect.getAttribute("data-format-id"),
        }
      : null;
    const fallbackWidth =
      rect && official
        ? (() => {
            const phrase = "PPC > 25 mmHg";
            return phrase.length * 8;
          })()
        : null;
    return {
      hasGroup: !!group,
      formatIdCount: group
        ? group.querySelectorAll("[data-format-id]").length
        : 0,
      undefinedIds: group
        ? [...group.querySelectorAll('[data-format-id="undefined"]')].length
        : 0,
      rectMetrics,
      hasNativeSvgMeasureApis:
        typeof official?.getStartPositionOfChar === "function" &&
        typeof official?.getSubStringLength === "function",
      looksLikeJsdoomFallback:
        rectMetrics &&
        Number.isFinite(rectMetrics.x) &&
        Number.isFinite(rectMetrics.y) &&
        rectMetrics.x === 0 &&
        rectMetrics.y === 0 &&
        rectMetrics.width === fallbackWidth,
      boldOverlays: texts
        .filter((node) => node.getAttribute("font-weight") === "bold")
        .map((node) => ({
          text: node.textContent,
          formatId: node.getAttribute("data-format-id"),
        })),
      learnerOnlyInsideGroup:
        !svg ||
        [...svg.querySelectorAll('[data-learner="true"]')].every((node) =>
          group?.contains(node)
        ),
    };
  }, elementId);
}

export function assertOfficialBaselineUnchanged(baseline, current, expect) {
  expect(current).not.toBeNull();
  expect(current.officials).toEqual(baseline.officials);
}
