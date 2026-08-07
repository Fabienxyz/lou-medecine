/**
 * VCCK-W1-R1 — protected surface fingerprinting (read-only corpus + baselines).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { REPO_ROOT } from "../paths.js";
import {
  VCCK_REGISTRY,
  VCCK_SNAPSHOTS,
  VCCK_APPROVED_PNG_MANIFEST,
  VCCK_PERCEPTUAL_APPROVAL,
} from "./paths.js";

/** Chapter 234 historical asset trees — any mutation invalidates replay proof. */
export const CHAPTER_234_PROTECTED_DIRS = Object.freeze([
  "01-learning/chapters/cardio/234/figures",
  "01-learning/chapters/cardio/234/build/visual-specs",
  "01-learning/chapters/cardio/234/build/rendered-visuals",
]);

/** Renderer and contract modules that must not change during replay. */
export const REPLAY_PROTECTED_RENDERER_FILES = Object.freeze([
  "tools/lou-build/lib/visual-spec.js",
  "tools/lou-build/lib/visual-spec-v02.js",
  "tools/lou-build/lib/visual-render.js",
  "tools/lou-build/lib/visual-render-svg-v02.js",
  "tools/lou-build/lib/vcck/w1-two-pole-svg.js",
  "tools/lou-build/lib/vcck/w1-flat-concurrent-svg.js",
  "tools/lou-build/lib/vcck/render-bridge.js",
  "tools/lou-build/lib/vcck/w1-pipeline.js",
  "tools/lou-build/lib/vcck/w1-contracts.js",
  "tools/lou-build/lib/vcck/w1-build-plan.js",
  "tools/lou-build/lib/vcck/w1-serialize.js",
  "tools/lou-build/lib/vcck/signature-analyzer.js",
  "tools/lou-build/lib/vcck/budgets.js",
]);

export const REPLAY_PROTECTED_BASELINE_FILES = Object.freeze([
  VCCK_REGISTRY,
  path.join(VCCK_SNAPSHOTS, "render-hashes.json"),
  VCCK_APPROVED_PNG_MANIFEST,
  VCCK_PERCEPTUAL_APPROVAL,
]);

function sha256File(absPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

function sha256Bytes(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function walkFiles(dirAbs, { extensions = null } = {}) {
  const files = [];
  if (!fs.existsSync(dirAbs)) return files;
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const full = path.join(dirAbs, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, { extensions }));
    } else if (!extensions || extensions.some((ext) => full.endsWith(ext))) {
      files.push(full);
    }
  }
  return files.sort();
}

export function fingerprintChapter234Assets() {
  const entries = [];
  for (const rel of CHAPTER_234_PROTECTED_DIRS) {
    const abs = path.join(REPO_ROOT, rel);
    for (const file of walkFiles(abs)) {
      const relFile = path.relative(REPO_ROOT, file);
      entries.push({ path: relFile, sha256: sha256File(file), size: fs.statSync(file).size });
    }
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return {
    dirs: [...CHAPTER_234_PROTECTED_DIRS],
    fileCount: entries.length,
    entries,
    digest: sha256Bytes(JSON.stringify(entries)),
  };
}

export function fingerprintProtectedFiles(relPaths) {
  const entries = [];
  for (const rel of relPaths) {
    const abs = path.isAbsolute(rel) ? rel : path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) {
      entries.push({ path: path.relative(REPO_ROOT, abs), missing: true, sha256: null });
      continue;
    }
    entries.push({
      path: path.relative(REPO_ROOT, abs),
      sha256: sha256File(abs),
      size: fs.statSync(abs).size,
    });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return { entries, digest: sha256Bytes(JSON.stringify(entries)) };
}

export function captureGitPreflight() {
  let head = null;
  let statusShort = "";
  try {
    head = execSync("git rev-parse HEAD", { cwd: REPO_ROOT, encoding: "utf8" }).trim();
    statusShort = execSync("git status --short", { cwd: REPO_ROOT, encoding: "utf8" });
  } catch {
    head = "unknown";
  }
  return { head, statusShort };
}

export function captureProtectedSurfaceFingerprint() {
  const git = captureGitPreflight();
  const chapter234 = fingerprintChapter234Assets();
  const renderers = fingerprintProtectedFiles(REPLAY_PROTECTED_RENDERER_FILES);
  const baselines = fingerprintProtectedFiles(REPLAY_PROTECTED_BASELINE_FILES.map((p) =>
    path.relative(REPO_ROOT, p),
  ));

  return {
    capturedAt: new Date().toISOString(),
    git,
    chapter234,
    renderers,
    baselines,
    digest: sha256Bytes(
      JSON.stringify({ chapter234: chapter234.digest, renderers: renderers.digest, baselines: baselines.digest }),
    ),
  };
}

export function compareProtectedFingerprints(before, after) {
  const changes = [];

  if (before.git?.head !== after.git?.head) {
    changes.push({ kind: "git-head", before: before.git?.head, after: after.git?.head });
  }

  if (before.chapter234?.digest !== after.chapter234?.digest) {
    const beforeMap = new Map((before.chapter234?.entries || []).map((e) => [e.path, e.sha256]));
    const afterMap = new Map((after.chapter234?.entries || []).map((e) => [e.path, e.sha256]));
    for (const [p, h] of beforeMap) {
      if (!afterMap.has(p)) changes.push({ kind: "chapter234-removed", path: p });
      else if (afterMap.get(p) !== h) changes.push({ kind: "chapter234-modified", path: p });
    }
    for (const p of afterMap.keys()) {
      if (!beforeMap.has(p)) changes.push({ kind: "chapter234-added", path: p });
    }
  }

  if (before.renderers?.digest !== after.renderers?.digest) {
    changes.push({ kind: "renderer-surface", detail: "renderer/contract file mutation detected" });
  }

  if (before.baselines?.digest !== after.baselines?.digest) {
    changes.push({ kind: "baseline-surface", detail: "registry/snapshot/approval mutation detected" });
  }

  return { ok: changes.length === 0, changes };
}
