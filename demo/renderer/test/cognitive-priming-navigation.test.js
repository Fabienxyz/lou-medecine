/**
 * AP-EF — explicit EDN navigation must open cognitive-priming on target chapter.
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodeCrypto from "node:crypto";
import { JSDOM } from "jsdom";
import * as LouShellBreadcrumb from "../shell/breadcrumb.mjs";
import { IDBFactory } from "fake-indexeddb";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CHAPTER_234 = "cardio/234";
const CHAPTER_220 = "cardio/220";

function buildAppDomHtml() {
  return `<!DOCTYPE html><html><body>
    <nav id="shell-breadcrumb"></nav>
    <div id="tabs"></div>
    <div id="content"></div>
    <h1 id="specialty"></h1>
    <ul id="objectives-list"></ul>
    <span id="read-time"></span>
  </body></html>`;
}

function buildTabsFor220() {
  return [
    {
      viewId: "cognitive-priming",
      label: "Amorçage cognitif",
      availability: "published",
      view: {
        viewId: "cognitive-priming",
        availability: "published",
        primingRef: {
          ref: "manifest",
          path: "build/cognitive-priming.v1.json",
          schema_version: 1,
          resolved: true,
        },
      },
    },
    {
      viewId: "mental-model",
      label: "Modèle mental",
      availability: "published",
      view: {
        viewId: "mental-model",
        availability: "published",
        blocks: [],
      },
    },
    {
      viewId: "notions",
      label: "Notions",
      availability: "published",
      view: { viewId: "notions", availability: "published", blocks: [] },
    },
  ];
}

async function setupAppHarness(options) {
  options = options || {};
  const navigationTabs = options.tabs || buildTabsFor220();
  const initialUrl =
    options.url ||
    "http://localhost/?chapter=" + encodeURIComponent(CHAPTER_220);

  const dom = new JSDOM(buildAppDomHtml(), {
    url: initialUrl,
    runScripts: "outside-only",
  });
  const window = dom.window;
  window.indexedDB = new IDBFactory();
  window.__LOU_NODE_CRYPTO__ = nodeCrypto;
  Object.defineProperty(window.navigator, "webdriver", {
    value: true,
    configurable: true,
  });

  window.history.replaceState = function (_state, _title, href) {
    if (href) {
      window.__lastReplaceState = String(href);
    }
  };

  let resumePlanApplied = false;

  for (const file of [
    "config.js",
    "learner-patrimony.js",
    "session-service.js",
    "session-resume.js",
  ]) {
    window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }

  const realApplyResumePlan = window.LouSessionResume.applyResumePlan;
  window.LouSessionResume.applyResumePlan = async function (plan, handlers) {
    resumePlanApplied = true;
    return realApplyResumePlan.call(this, plan, handlers);
  };

  const realCreateCommitController =
    window.LouSessionResume.createCommitController;
  window.LouSessionResume.createCommitController = function (
    getCurrentViewState
  ) {
    const controller = realCreateCommitController(getCurrentViewState);
    return Object.assign({}, controller, {
      onViewChanged: function () {},
      flushViewLeave: function () {
        return Promise.resolve(null);
      },
      bindLifecycleEvents: function () {},
    });
  };

  window.LouMarkdown = { parse: function (text) { return text; } };
  window.LouComposition = {
    buildReadingViewModel: async function () {
      return {
        readingViewModel: {
          views: navigationTabs.map(function (tab) {
            return tab.view;
          }),
        },
      };
    },
    buildNavigationFromViewModel: function () {
      return navigationTabs.map(function (tab) {
        return Object.assign({}, tab);
      });
    },
  };

  window.LouRenderer = {
    init: function () {},
    showMessage: function () {},
    loadPublishedManifest: async function () {
      return {
        ok: true,
        manifest: {
          title: "Chapitre cible",
          chapter: CHAPTER_220,
          release_id: "cardio__220__2022__1",
        },
      };
    },
    applyHeaderMetadata: function () {},
    manifestErrorMessage: function () {
      return "manifest error";
    },
    renderComposedView: async function () {},
    projectionAvailabilityMessage: function () {
      return "";
    },
    viewAvailabilityMessage: function () {
      return "";
    },
  };

  window.LouLearnerStore = {
    setReleaseContext: function () {},
    getReleaseContext: function () {
      return {
        releaseId: "cardio__220__2022__1",
        chapter: CHAPTER_220,
      };
    },
    listSessionRecords: async function () {
      return options.sessionRecords || [];
    },
    getSessionForRelease: async function () {
      return null;
    },
    upsertSessionRecord: async function () {
      return null;
    },
  };

  window.LouShellBreadcrumb = LouShellBreadcrumb;

  window.eval(fs.readFileSync(path.join(ROOT, "app.js"), "utf8"));

  if (window.LouApp && window.LouApp.whenTabReady) {
    await window.LouApp.whenTabReady();
  }
  await new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });

  return {
    window: window,
    wasResumePlanApplied: function () {
      return resumePlanApplied;
    },
  };
}

describe("Lot AP-EF — EDN explicit target view navigation", () => {
  test("cross-chapter navigateToChapterById encodes view=cognitive-priming", async () => {
    const harness = await setupAppHarness({
      url:
        "http://localhost/?chapter=" + encodeURIComponent(CHAPTER_234),
      tabs: buildTabsFor220(),
    });
    const window = harness.window;

    const href = window.LouApp.buildChapterNavigationHref(CHAPTER_220, {
      targetViewId: "cognitive-priming",
    });
    assert.ok(href);
    const url = new URL(href, "http://localhost/");
    assert.equal(url.searchParams.get("chapter"), CHAPTER_220);
    assert.equal(url.searchParams.get("view"), "cognitive-priming");
  });

  test("cross-chapter navigateToChapterById without targetViewId leaves view param unset", async () => {
    const harness = await setupAppHarness({
      url:
        "http://localhost/?chapter=" + encodeURIComponent(CHAPTER_234),
    });

    const href = harness.window.LouApp.buildChapterNavigationHref(CHAPTER_220);
    assert.ok(href);
    const url = new URL(href, "http://localhost/");
    assert.equal(url.searchParams.get("chapter"), CHAPTER_220);
    assert.equal(url.searchParams.get("view"), null);
  });

  test("same-chapter navigation opens cognitive-priming directly", async () => {
    const harness = await setupAppHarness({
      url:
        "http://localhost/?chapter=" +
        encodeURIComponent(CHAPTER_220) +
        "&view=mental-model",
    });
    const window = harness.window;

    await window.LouApp.navigateToChapterById(CHAPTER_220, {
      targetViewId: "cognitive-priming",
    });

    assert.equal(window.LouApp.getCurrentViewId(), "cognitive-priming");
  });

  test("boot with view=cognitive-priming overrides session resume target", async () => {
    const harness = await setupAppHarness({
      url:
        "http://localhost/?chapter=" +
        encodeURIComponent(CHAPTER_220) +
        "&view=cognitive-priming",
      sessionRecords: [
        {
          logical_record_id: "session_resume::cardio__220__2022__1::1",
          release_id: "cardio__220__2022__1",
          chapter: CHAPTER_220,
          viewId: "notions",
          resumePoint: { kind: "element_block", elementId: "MEC-oap" },
          schema_version: 1,
          last_activity_at: "2026-08-01T12:00:00.000Z",
        },
      ],
    });

    assert.equal(harness.window.LouApp.getCurrentViewId(), "cognitive-priming");
    assert.equal(harness.wasResumePlanApplied(), false);
    assert.ok(harness.window.__lastReplaceState);
    assert.ok(!harness.window.__lastReplaceState.includes("view="));
  });

  test("boot without view param still applies session resume", async () => {
    const harness = await setupAppHarness({
      url:
        "http://localhost/?chapter=" + encodeURIComponent(CHAPTER_220),
      sessionRecords: [
        {
          logical_record_id: "session_resume::cardio__220__2022__1::1",
          release_id: "cardio__220__2022__1",
          chapter: CHAPTER_220,
          viewId: "notions",
          resumePoint: { kind: "element_block", elementId: "MEC-oap" },
          schema_version: 1,
          last_activity_at: "2026-08-01T12:00:00.000Z",
        },
      ],
    });

    assert.equal(harness.wasResumePlanApplied(), true);
    assert.equal(harness.window.LouApp.getCurrentViewId(), "notions");
  });
});

describe("Lot AP-EF — Renderer EDN callback", () => {
  let window;
  let config;
  let renderer;
  let navigateCalls;

  before(() => {
    const dom = new JSDOM(
      `<!DOCTYPE html><body><div id="content"></div></body>`,
      {
        url: "https://example.test/demo/renderer/?chapter=cardio/234",
        runScripts: "outside-only",
      }
    );
    window = dom.window;
    navigateCalls = [];
    window.LouApp = {
      navigateToChapterById: async function (chapterId, options) {
        navigateCalls.push({ chapterId: chapterId, options: options || {} });
      },
    };
    window.eval(fs.readFileSync(path.join(ROOT, "config.js"), "utf8"));
    window.eval(
      fs.readFileSync(path.join(ROOT, "cognitive-priming-render.js"), "utf8")
    );
    window.eval(fs.readFileSync(path.join(ROOT, "renderer.js"), "utf8"));
    config = window.LouConfig;
    renderer = window.LouRenderer;
    renderer.init(window.document.getElementById("content"), null);
  });

  test("renderCognitivePrimingView wires EDN navigate with targetViewId", async () => {
    config._packageAccess = {
      getActiveRelease: async function () {
        return { release_id: "cardio__220__2022__1" };
      },
    };
    config.productMode = true;

    const record = {
      schema_version: 1,
      chapter_id: "cardio/234",
      profile: { comprehension: 1, memorization: 1 },
      prerequisites: {
        edn_references: [
          {
            reference_id: "edn-1",
            chapter_id: CHAPTER_220,
            label: "Item 220",
          },
        ],
        ai_complements: [],
      },
      summary: { bullets: ["Bullet."] },
    };

    window.fetch = async function () {
      return {
        ok: true,
        text: async () => JSON.stringify(record),
      };
    };

    await renderer.renderCognitivePrimingView(
      {
        viewId: "cognitive-priming",
        availability: "published",
        primingRef: {
          ref: "manifest",
          path: "build/cognitive-priming.v1.json",
          schema_version: 1,
          resolved: true,
        },
      },
      { chapter: CHAPTER_234, title: "IC" },
      CHAPTER_234,
      config
    );

    const btn = window.document.querySelector(".cp-edn-ref--navigable");
    assert.ok(btn);
    btn.click();
    assert.equal(navigateCalls.length, 1);
    assert.equal(navigateCalls[0].chapterId, CHAPTER_220);
    assert.equal(navigateCalls[0].options.targetViewId, "cognitive-priming");
  });
});
