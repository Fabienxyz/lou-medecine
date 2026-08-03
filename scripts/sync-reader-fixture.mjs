#!/usr/bin/env node
/**
 * Synchronize a published chapter package into the Reader test library fixture.
 *
 * Generic — parameterized by chapter path and library root. Removes a stale
 * installed release when content_digest changed, cleans incomplete staging dirs,
 * then runs the atomic library installer.
 *
 * Usage:
 *   node scripts/sync-reader-fixture.mjs
 *   node scripts/sync-reader-fixture.mjs --chapter 01-learning/chapters/cardio/234 \
 *     --library demo/renderer/test/fixtures/product-library
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installPublishedRelease } from "../tools/lou-build/lib/library-install.js";
import { resolveChapterDir } from "../tools/lou-build/lib/paths.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function flagValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function resolveLibraryRoot(raw) {
  const normalized = raw.replace(/\\/g, "/").replace(/\/$/, "");
  if (normalized.includes("..")) {
    throw new Error("Invalid library path");
  }
  return path.isAbsolute(normalized)
    ? normalized
    : path.join(ROOT, normalized);
}

function cleanStaging(libraryRoot) {
  const staging = path.join(libraryRoot, "packages", ".staging");
  if (!fs.existsSync(staging)) return 0;
  let removed = 0;
  for (const entry of fs.readdirSync(staging)) {
    fs.rmSync(path.join(staging, entry), { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

function removeInstalledReleaseIfDigestChanged(libraryRoot, chapterDir) {
  const sourceManifestPath = path.join(chapterDir, "manifest.json");
  if (!fs.existsSync(sourceManifestPath)) {
    throw new Error(`No manifest.json at ${sourceManifestPath}`);
  }
  const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf8"));
  const releaseId = sourceManifest.release_id;
  if (typeof releaseId !== "string") {
    throw new Error("manifest release_id missing");
  }
  const finalRoot = path.join(libraryRoot, "packages", releaseId);
  if (!fs.existsSync(finalRoot)) {
    return { removed: false, releaseId };
  }
  const installedManifest = JSON.parse(
    fs.readFileSync(path.join(finalRoot, "manifest.json"), "utf8"),
  );
  if (installedManifest.content_digest === sourceManifest.content_digest) {
    return { removed: false, releaseId };
  }
  fs.rmSync(finalRoot, { recursive: true, force: true });
  return { removed: true, releaseId };
}

const args = process.argv.slice(2);
const chapterArg =
  flagValue(args, "--chapter") || "01-learning/chapters/cardio/234";
const libraryArg =
  flagValue(args, "--library") ||
  "demo/renderer/test/fixtures/product-library";

const chapterDir = resolveChapterDir(chapterArg);
const libraryRoot = resolveLibraryRoot(libraryArg);

fs.mkdirSync(libraryRoot, { recursive: true });

const stagingRemoved = cleanStaging(libraryRoot);
const { removed, releaseId } = removeInstalledReleaseIfDigestChanged(
  libraryRoot,
  chapterDir,
);

const result = installPublishedRelease(chapterDir, libraryRoot, {
  activate: true,
});

console.log("SYNC PASS");
console.log(`  chapter:         ${chapterDir}`);
console.log(`  library:         ${libraryRoot}`);
console.log(`  release_id:      ${result.release_id}`);
console.log(`  idempotent:      ${result.idempotent}`);
console.log(`  digest_replaced: ${removed}`);
console.log(`  staging_cleaned: ${stagingRemoved}`);
