import { test } from "node:test";
import assert from "node:assert/strict";
import { auditAntiSpecializationTransitive } from "../lib/vcck/anti-specialization.js";

test("VCCK modules pass anti-specialization audit", () => {
  const result = auditAntiSpecializationTransitive();
  assert.equal(result.ok, true, JSON.stringify(result.violations, null, 2));
});
