// CaretAnchor primitive tests (Renderer V2.2 commit 3).
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

function walkthroughHtml(inner) {
  return `<div class="block-walkthrough" data-official="true">${inner}</div>`;
}

function textNodeAt(walkthrough, globalOffset) {
  let found = null;
  window.LouCaretAnchor._walkOfficialTextNodes(
    walkthrough,
    function (node, start, len) {
      if (found) {
        return;
      }
      if (globalOffset >= start && globalOffset <= start + len) {
        found = { node, offset: globalOffset - start };
      }
    }
  );
  return found;
}

let window;
let document;

before(() => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
    url: "https://example.test/demo/renderer/",
    runScripts: "outside-only",
  });
  window = dom.window;
  document = window.document;
  loadScripts(dom, ["caret-anchor.js"]);
});

describe("CaretAnchor primitives", () => {
  test("WT-01 offset includes text inside mark (transparent wrapper)", () => {
    document.body.innerHTML = walkthroughHtml(
      "<p>Hello <mark class=\"learner-highlight\">world</mark>!</p>"
    );
    const walkthrough = document.querySelector(".block-walkthrough");
    const insideMark = walkthrough.querySelector("mark").firstChild;
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      insideMark,
      2
    );

    assert.ok(anchor);
    assert.equal(anchor.type, "CaretAnchor");
    assert.equal(anchor.offset, 8);

    const range = window.LouCaretAnchor.restoreCaretAnchor(walkthrough, anchor);
    assert.ok(range);
    assert.equal(range.startContainer, insideMark);
    assert.equal(range.startOffset, 2);
    assert.equal(range.toString(), "");
  });

  test("WT-02 offset excludes walkthrough-note text (additive learner content)", () => {
    document.body.innerHTML = walkthroughHtml(
      "<p>Before <span class=\"walkthrough-note\">hidden</span> after</p>"
    );
    const walkthrough = document.querySelector(".block-walkthrough");
    const stream = window.LouCaretAnchor._officialStreamText(walkthrough);
    assert.equal(stream, "Before  after");

    const afterText = textNodeAt(walkthrough, 7);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      afterText.node,
      afterText.offset
    );
    assert.ok(anchor);
    assert.equal(anchor.offset, 7);

    const insideNote = walkthrough.querySelector(".walkthrough-note").firstChild;
    assert.equal(
      window.LouCaretAnchor.createCaretAnchor(walkthrough, insideNote, 0),
      null
    );
  });

  test("WT-03 caretRangeFromOffset half-open on fragmented DOM", () => {
    document.body.innerHTML = walkthroughHtml(
      "<p>Alpha beta gamma</p>"
    );
    const walkthrough = document.querySelector(".block-walkthrough");
    const p = walkthrough.querySelector("p");
    const textNode = p.firstChild;
    const tail = textNode.splitText(6);
    const mark = document.createElement("mark");
    mark.className = "learner-highlight";
    mark.appendChild(tail);
    p.appendChild(mark);

    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      mark.firstChild,
      0
    );
    assert.ok(anchor);
    assert.equal(anchor.offset, 6);

    const range = window.LouCaretAnchor.restoreCaretAnchor(walkthrough, anchor);
    assert.ok(range);
    assert.equal(
      window.LouCaretAnchor._caretOffsetFromDomPoint(
        walkthrough,
        range.startContainer,
        range.startOffset
      ),
      6
    );
  });

  test("WT-04 restored range is collapsed (start === end)", () => {
    document.body.innerHTML = walkthroughHtml("<p>One two three</p>");
    const walkthrough = document.querySelector(".block-walkthrough");
    const point = textNodeAt(walkthrough, 4);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );
    const range = window.LouCaretAnchor.restoreCaretAnchor(walkthrough, anchor);

    assert.ok(range);
    assert.equal(range.collapsed, true);
    assert.equal(range.startContainer, range.endContainer);
    assert.equal(range.startOffset, range.endOffset);
  });

  test("WT-05 resolveAnchor uses prefix/suffix disambiguation", () => {
    document.body.innerHTML = walkthroughHtml("<p>aa aa aa</p>");
    const walkthrough = document.querySelector(".block-walkthrough");
    const point = textNodeAt(walkthrough, 5);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );
    assert.equal(anchor.offset, 5);

    const range = window.LouCaretAnchor.restoreCaretAnchor(walkthrough, anchor);
    assert.ok(range);
    assert.equal(
      window.LouCaretAnchor._caretOffsetFromDomPoint(
        walkthrough,
        range.startContainer,
        range.startOffset
      ),
      5
    );

    const stale = { ...anchor, offset: 0 };
    const recovered = window.LouCaretAnchor.restoreCaretAnchor(
      walkthrough,
      stale
    );
    assert.ok(recovered);
    assert.equal(
      window.LouCaretAnchor._caretOffsetFromDomPoint(
        walkthrough,
        recovered.startContainer,
        recovered.startOffset
      ),
      5
    );
  });

  test("anchor at beginning of official stream (offset 0)", () => {
    document.body.innerHTML = walkthroughHtml("<p>Start here</p>");
    const walkthrough = document.querySelector(".block-walkthrough");
    const point = textNodeAt(walkthrough, 0);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );
    const range = window.LouCaretAnchor.restoreCaretAnchor(walkthrough, anchor);

    assert.equal(anchor.offset, 0);
    assert.ok(range);
    assert.equal(
      window.LouCaretAnchor._caretOffsetFromDomPoint(
        walkthrough,
        range.startContainer,
        range.startOffset
      ),
      0
    );
  });

  test("anchor at end of official stream (offset === length)", () => {
    document.body.innerHTML = walkthroughHtml("<p>End here</p>");
    const walkthrough = document.querySelector(".block-walkthrough");
    const length = window.LouCaretAnchor._officialStreamLength(walkthrough);
    const point = textNodeAt(walkthrough, length);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );
    const range = window.LouCaretAnchor.restoreCaretAnchor(walkthrough, anchor);

    assert.equal(anchor.offset, length);
    assert.ok(range);
    assert.equal(range.collapsed, true);
    assert.equal(
      window.LouCaretAnchor._caretOffsetFromDomPoint(
        walkthrough,
        range.startContainer,
        range.startOffset
      ),
      length
    );
  });

  test("invalid anchors fail restore", () => {
    document.body.innerHTML = walkthroughHtml("<p>Stable text</p>");
    const walkthrough = document.querySelector(".block-walkthrough");
    const point = textNodeAt(walkthrough, 3);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );

    assert.equal(window.LouCaretAnchor.restoreCaretAnchor(walkthrough, null), null);
    assert.equal(
      window.LouCaretAnchor.restoreCaretAnchor(walkthrough, { type: "Other" }),
      null
    );
    assert.equal(
      window.LouCaretAnchor.restoreCaretAnchor(walkthrough, {
        ...anchor,
        prefix: "wrong",
      }),
      null
    );
    assert.equal(
      window.LouCaretAnchor.restoreCaretAnchor(walkthrough, {
        ...anchor,
        offset: 999,
        prefix: "___no-match___",
        suffix: "___no-match___",
      }),
      null
    );
  });
});
