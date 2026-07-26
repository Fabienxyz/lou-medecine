/** Test-only instrumentation — wraps production APIs without modifying source files. */

export const TRACE_INSTALL = () => {
  window.__HL = {
    events: [],
    domSnapshots: [],
    idbSnapshots: [],
    seq: 0,
  };

  function nextId() {
    return ++window.__HL.seq;
  }

  function serializeRange(range) {
    if (!range) return null;
    try {
      return {
        collapsed: range.collapsed,
        startContainer: range.startContainer?.nodeName,
        startOffset: range.startOffset,
        startText: (range.startContainer?.textContent || "").slice(0, 80),
        endContainer: range.endContainer?.nodeName,
        endOffset: range.endOffset,
        endText: (range.endContainer?.textContent || "").slice(0, 80),
        text: range.toString(),
      };
    } catch (e) {
      return { error: String(e) };
    }
  }

  function serializeSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return { empty: true };
    return {
      isCollapsed: sel.isCollapsed,
      rangeCount: sel.rangeCount,
      text: sel.toString(),
      range: serializeRange(sel.getRangeAt(0)),
    };
  }

  function walkthroughDigest(rootSelector) {
    const wt =
      document.querySelector(rootSelector)?.querySelector(".block-walkthrough") ||
      document.querySelector(".block-walkthrough[data-official='true']");
    if (!wt) return { missing: true };
    const marks = [...wt.querySelectorAll("mark.learner-highlight")];
    const textNodes = [];
    const walker = document.createTreeWalker(wt, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      textNodes.push({
        len: n.textContent.length,
        sample: n.textContent.slice(0, 40),
        parent: n.parentElement?.tagName,
        inMark: !!n.parentElement?.closest("mark.learner-highlight"),
      });
    }
    return {
      official: wt.dataset.official,
      textLength: wt.textContent.length,
      textSample: wt.textContent.slice(0, 120),
      innerHTMLLength: wt.innerHTML.length,
      markCount: marks.length,
      marks: marks.map((m) => ({
        text: m.textContent,
        className: m.className,
        dataset: { ...m.dataset },
        parentTag: m.parentElement?.tagName,
        outerHTML: m.outerHTML.slice(0, 160),
      })),
      textNodeCount: textNodes.length,
      textNodes,
    };
  }

  async function dumpIdb(label) {
    const chapter = "cardio/234";
    const db = await window.LouLearnerStore.open();
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction("text_annotations", "readonly");
      const req = tx.objectStore("text_annotations").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    const filtered = rows.filter((r) => r.chapter === chapter);
    const snap = {
      id: nextId(),
      label,
      ts: Date.now(),
      rows: filtered.map((r) => ({
        id: r.id,
        chapter: r.chapter,
        projection: r.projection,
        element: r.element,
        kind: r.kind,
        created: r.created,
        selector: r.selector
          ? {
              type: r.selector.type,
              exact: r.selector.exact,
              prefixLen: (r.selector.prefix || "").length,
              suffixLen: (r.selector.suffix || "").length,
              prefix: (r.selector.prefix || "").slice(-32),
              suffix: (r.selector.suffix || "").slice(0, 32),
            }
          : null,
      })),
    };
    window.__HL.idbSnapshots.push(snap);
    return snap;
  }

  function snapDom(label, rootSelector = '[data-element="MM-pump-decompensation"]') {
    const snap = {
      id: nextId(),
      label,
      ts: Date.now(),
      activeTab: document.querySelector(".tab.active")?.textContent?.trim(),
      boundHost: window.LouTextHighlights?._boundHost?.id || null,
      selectionContextProjection:
        window.LouTextHighlights?._selectionContext?.context?.projection?.id ||
        null,
      walkthrough: walkthroughDigest(rootSelector),
      allMarksInContent: [...document.querySelectorAll("#content mark.learner-highlight")].map(
        (m) => m.textContent
      ),
    };
    window.__HL.domSnapshots.push(snap);
    return snap;
  }

  function log(type, detail) {
    window.__HL.events.push({
      id: nextId(),
      ts: Date.now(),
      type,
      ...detail,
    });
  }

  window.__HL.snapDom = snapDom;
  window.__HL.dumpIdb = dumpIdb;
  window.__HL.log = log;

  const TH = window.LouTextHighlights;
  const LS = window.LouLearnerStore;

  const orig = {
    mount: TH.mount.bind(TH),
    bindSelection: TH.bindSelection.bind(TH),
    restore: TH.restore.bind(TH),
    _onSelectionChange: TH._onSelectionChange.bind(TH),
    _applyCurrentSelection: TH._applyCurrentSelection.bind(TH),
    wrapRangeInMark: TH.wrapRangeInMark.bind(TH),
    dismissToolbar: TH.dismissToolbar.bind(TH),
    addTextHighlight: LS.addTextHighlight.bind(LS),
  };

  TH.mount = async function (host, context) {
    log("mount.enter", {
      hostId: host?.id,
      projectionId: context?.projection?.id,
      chapter: context?.chapter,
    });
    await orig.mount(host, context);
    log("mount.exit", {
      hostId: host?.id,
      projectionId: context?.projection?.id,
      boundHost: TH._boundHost?.id,
    });
  };

  TH.bindSelection = function (host, context) {
    const skipped = TH._boundHost === host;
    log("bindSelection", {
      hostId: host?.id,
      projectionId: context?.projection?.id,
      boundHostBefore: TH._boundHost?.id || null,
      skipped,
    });
    return orig.bindSelection(host, context);
  };

  TH.restore = async function (host, context) {
    log("restore.enter", {
      hostId: host?.id,
      projectionId: context?.projection?.id,
    });
    const rows = context?.store?.listTextHighlights
      ? await context.store.listTextHighlights(
          context.chapter,
          context.projection?.id
        )
      : [];
    log("restore.rows", {
      projectionId: context?.projection?.id,
      rowCount: rows.length,
      rows: rows.map((r) => ({
        id: r.id,
        element: r.element,
        exact: r.selector?.exact?.slice(0, 60),
      })),
    });
    await orig.restore(host, context);
    log("restore.exit", {
      projectionId: context?.projection?.id,
      markCount: document.querySelectorAll("mark.learner-highlight").length,
    });
  };

  TH._onSelectionChange = function (host, context) {
    log("selectionchange", {
      projectionId: context?.projection?.id,
      chapter: context?.chapter,
      selection: serializeSelection(),
    });
    orig._onSelectionChange(host, context);
    log("selectionchange.after", {
      toolbarVisible:
        !!document.querySelector(".highlight-toolbar") &&
        !document.querySelector(".highlight-toolbar").hidden,
      hasSelectionContext: !!TH._selectionContext,
      contextProjection: TH._selectionContext?.context?.projection?.id,
    });
  };

  TH._applyCurrentSelection = function () {
    const ctx = TH._selectionContext;
    log("highlight.command", {
      projectionId: ctx?.context?.projection?.id,
      element: ctx?.element,
      range: serializeRange(ctx?.range),
    });
    snapDom("before-wrapRangeInMark");
    const result = orig._applyCurrentSelection();
    snapDom("after-applyCurrentSelection");
    log("highlight.command.done", {
      projectionId: ctx?.context?.projection?.id,
    });
    return result;
  };

  TH.wrapRangeInMark = function (range) {
    const before = serializeRange(range);
    snapDom("wrapRangeInMark.before");
    const mark = orig.wrapRangeInMark(range);
    snapDom("wrapRangeInMark.after");
    log("wrapRangeInMark", {
      rangeBefore: before,
      markCreated: !!mark,
      markText: mark?.textContent || null,
      markHTML: mark?.outerHTML?.slice(0, 200) || null,
    });
    return mark;
  };

  LS.addTextHighlight = async function (
    chapter,
    projection,
    element,
    selector
  ) {
    log("addTextHighlight.enter", {
      chapter,
      projection,
      element,
      exact: selector?.exact?.slice(0, 80),
    });
    try {
      const id = await orig.addTextHighlight(
        chapter,
        projection,
        element,
        selector
      );
      await dumpIdb("after-addTextHighlight");
      log("addTextHighlight.ok", { id, projection });
      return id;
    } catch (err) {
      log("addTextHighlight.error", { projection, error: String(err) });
      throw err;
    }
  };

  // Capture real mouseup path projection (closure) by wrapping the listener install
  const origAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (
      type === "mouseup" &&
      this.id === "content" &&
      listener &&
      listener.toString().includes("_onSelectionChange")
    ) {
      log("bindSelection.mouseupListenerInstalled", {
        note: "listener closure captures context at first bindSelection",
      });
    }
    return origAddEventListener.call(this, type, listener, options);
  };

  log("instrumentation.installed", {});
};

export async function installTrace(page) {
  await page.evaluate(TRACE_INSTALL);
}

export async function exportTrace(page) {
  return page.evaluate(() => window.__HL);
}

export async function snap(page, label, rootSelector) {
  return page.evaluate(
    ({ label, rootSelector }) => window.__HL.snapDom(label, rootSelector),
    { label, rootSelector }
  );
}

export async function dumpIdb(page, label) {
  return page.evaluate(
    (label) => window.__HL.dumpIdb(label),
    label
  );
}
