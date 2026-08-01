#!/usr/bin/env node
/**
 * lou-library CLI — install published Releases into LIBRARY_ROOT (D1-C).
 */
import path from "node:path";
import { installPublishedRelease } from "../../lib/library-install.js";
import { catalogPath, loadOrCreateCatalog } from "../../lib/library-catalog.js";
import { resolveChapterDir } from "../../lib/paths.js";
import { scheduleOfflinePrepareAfterInstall } from "../../lib/library-offline-scheduler.js";

const args = process.argv.slice(2);
const command = args[0];

function usage(): never {
  console.error(`Usage:
  lou-library install --chapter <path> --library <LIBRARY_ROOT> [--library-id <id>]

  <path> is relative to the repository root (no ".."), or absolute.
  Example: --chapter 01-learning/chapters/cardio/234

Environment:
  LOU_LIBRARY_ROOT   default library root when --library is omitted
`);
  process.exit(2);
}

if (!command || command !== "install") {
  usage();
}

function flagValue(name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

const chapterArg =
  flagValue("--chapter") || "01-learning/chapters/cardio/234";

const libraryRoot =
  flagValue("--library") ||
  process.env.LOU_LIBRARY_ROOT ||
  path.resolve(process.cwd(), ".lou-library");

const libraryId = flagValue("--library-id");

let chapterDir: string;
try {
  chapterDir = resolveChapterDir(chapterArg);
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  process.exit(2);
}

try {
  const result = installPublishedRelease(chapterDir, libraryRoot, {
    libraryId,
    activate: true,
    onInstalled: ({ releaseId, libraryRoot: root, idempotent }) => {
      scheduleOfflinePrepareAfterInstall(root, { releaseId, idempotent });
    },
  });
  const catalog = loadOrCreateCatalog(libraryRoot);
  console.log("INSTALL PASS");
  console.log(`  library:    ${result.libraryRoot}`);
  console.log(`  catalog:    ${catalogPath(result.libraryRoot)}`);
  console.log(`  release_id: ${result.release_id}`);
  console.log(`  root:       ${result.root}`);
  console.log(`  idempotent: ${result.idempotent}`);
  console.log(`  entries:    ${catalog.entries.length}`);
  console.log(
    `  active:     ${JSON.stringify(catalog.active_by_chapter)}`,
  );
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.error("INSTALL FAIL");
  console.error(message);
  process.exit(1);
}
