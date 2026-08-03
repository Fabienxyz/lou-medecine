import { test } from "node:test";
import assert from "node:assert/strict";
import { BrowserOfflineManagerError } from "../library/browser-offline-manager.js";
import { PackageAccessError } from "../library/package-access-shared.js";
import { OfflineRuntimeError } from "../library/offline-runtime-shared.js";
import {
  classifyProductBootstrapError,
  formatProductBootstrapError,
} from "../library/product-bootstrap-errors.js";

const MESSAGES = {
  DIGEST_DIVERGENT: "Digest divergent.",
  ASSET_MISSING: "Asset missing.",
  UNKNOWN: "Unknown failure.",
};

test("classifyProductBootstrapError maps BrowserOfflineManagerError codes", () => {
  const err = new BrowserOfflineManagerError(
    "DIGEST_DIVERGENT",
    "catalog content_digest differs"
  );
  assert.equal(classifyProductBootstrapError(err), "DIGEST_DIVERGENT");
});

test("classifyProductBootstrapError maps OfflineRuntimeError DIGEST_MISMATCH", () => {
  const err = new OfflineRuntimeError(
    "DIGEST_MISMATCH",
    "offline runtime: digest mismatch"
  );
  assert.equal(classifyProductBootstrapError(err), "DIGEST_DIVERGENT");
});

test("classifyProductBootstrapError maps PackageAccessError ASSET_MISSING", () => {
  const err = new PackageAccessError("ASSET_MISSING", "figures/missing.svg");
  assert.equal(classifyProductBootstrapError(err), "ASSET_MISSING");
});

test("formatProductBootstrapError includes code and detail", () => {
  const err = new BrowserOfflineManagerError(
    "ASSET_MISSING",
    "figures/mm-pump-decompensation.svg not found"
  );
  const text = formatProductBootstrapError(err, MESSAGES);
  assert.match(text, /Asset missing/);
  assert.match(text, /ASSET_MISSING/);
  assert.match(text, /mm-pump-decompensation/);
});
