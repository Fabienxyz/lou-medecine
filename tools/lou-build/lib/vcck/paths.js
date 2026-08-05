import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT } from "../paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Generic VCCK root — distinct from local phase1a review trees. */
export const VCCK_ROOT = path.join(REPO_ROOT, "tools/lou-build/vcck");

export const VCCK_REGISTRY = path.join(VCCK_ROOT, "registry/families.json");
export const VCCK_FIXTURES = path.join(VCCK_ROOT, "fixtures");
export const VCCK_POSITIVE = path.join(VCCK_FIXTURES, "positive");
export const VCCK_NEGATIVE = path.join(VCCK_FIXTURES, "negative");
export const VCCK_INVENTORY = path.join(VCCK_FIXTURES, "inventory.yaml");
export const VCCK_OUTPUT = path.join(VCCK_ROOT, "output");
export const VCCK_REPORTS = path.join(VCCK_ROOT, "reports");
export const VCCK_REJECT = path.join(VCCK_FIXTURES, "reject");
export const VCCK_W1 = path.join(VCCK_FIXTURES, "w1");
export const VCCK_GALLERY = path.join(VCCK_ROOT, "gallery");
export const VCCK_SNAPSHOTS = path.join(VCCK_ROOT, "snapshots");

/** Authoritative VCCK dirs that tests/dry-runs must never mutate. */
export const VCCK_AUTHORITATIVE_DIRS = [
  VCCK_OUTPUT,
  VCCK_REPORTS,
  VCCK_GALLERY,
  path.dirname(VCCK_REGISTRY),
];

let _outputOverride = null;

export function setVcckOutputDir(dir) {
  _outputOverride = dir;
}

export function getVcckOutputDir(override = undefined) {
  if (override != null) return override;
  return _outputOverride || VCCK_OUTPUT;
}

export function resetVcckOutputDir() {
  _outputOverride = null;
}

export const VCCK_VIEWPORT_WIDTHS = [375, 530, 768, 1280, 2400];

export const VCCK_LIB_DIR = path.join(REPO_ROOT, "tools/lou-build/lib/vcck");
