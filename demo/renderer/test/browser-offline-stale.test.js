import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { OFFLINE_STATUS } from "../library/offline-state.js";
import { assessReleaseStale } from "../library/browser-offline-stale.js";

describe("browser offline stale (D2-H)", () => {
  test("offline_ready with missing runtime is stale → failed", () => {
    const result = assessReleaseStale({
      catalogStatus: OFFLINE_STATUS.OFFLINE_READY,
      catalogDigest: "abc",
      manifestDigest: "abc",
      runtimeMetadata: null,
      hasCompleteRuntime: false,
      packageAssetsAvailable: true,
    });
    assert.equal(result.stale, true);
    assert.equal(result.recommendedStatus, OFFLINE_STATUS.FAILED);
    assert.ok(result.reasons.includes("RUNTIME_NAMESPACE_MISSING"));
  });

  test("not_prepared is never stale", () => {
    const result = assessReleaseStale({
      catalogStatus: OFFLINE_STATUS.NOT_PREPARED,
      catalogDigest: "abc",
      manifestDigest: "abc",
      runtimeMetadata: null,
      hasCompleteRuntime: false,
      packageAssetsAvailable: false,
    });
    assert.equal(result.stale, false);
  });

  test("digest divergence between runtime and catalogue is stale", () => {
    const result = assessReleaseStale({
      catalogStatus: OFFLINE_STATUS.OFFLINE_READY,
      catalogDigest: "catalog-digest",
      manifestDigest: "catalog-digest",
      runtimeMetadata: { content_digest: "runtime-digest" },
      hasCompleteRuntime: false,
      packageAssetsAvailable: true,
    });
    assert.equal(result.stale, true);
    assert.ok(result.reasons.includes("RUNTIME_CATALOG_DIGEST_DIVERGENT"));
  });
});
