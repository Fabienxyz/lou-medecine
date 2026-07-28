import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runAcquisition as runAcquisitionLegacy } from "../lib/acquisition.js";
import { createContext } from "../src/pipeline/context.js";
import { runAcquisition } from "../src/stages/acquisition.js";

describe("Stage A — acquisition migration parity", () => {
  it("migrated runAcquisition matches legacy lib/acquisition.js", () => {
    const ctx = createContext("/tmp/chapter", "validate");

    const legacy = runAcquisitionLegacy(ctx);
    const migrated = runAcquisition(ctx);

    assert.deepEqual(migrated.ok, legacy.ok);
    assert.deepEqual(migrated.errors, legacy.errors);
    assert.deepEqual(migrated.data, legacy.data);
  });

  it("returns identical results for build command", () => {
    const ctx = createContext("/tmp/chapter", "build");

    const legacy = runAcquisitionLegacy(ctx);
    const migrated = runAcquisition(ctx);

    assert.deepEqual(migrated, {
      ok: legacy.ok,
      errors: legacy.errors,
      data: legacy.data,
    });
  });
});
