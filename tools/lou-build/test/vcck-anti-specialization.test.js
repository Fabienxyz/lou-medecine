import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  auditAntiSpecialization,
  auditAntiSpecializationFiles,
  auditAntiSpecializationTransitive,
} from "../lib/vcck/anti-specialization.js";

test("VCCK modules pass anti-specialization audit", () => {
  const result = auditAntiSpecializationTransitive();
  assert.equal(result.ok, true, JSON.stringify(result.violations, null, 2));
});

test("auditAntiSpecialization alias matches transitive closure", () => {
  const authoritative = auditAntiSpecialization();
  const transitive = auditAntiSpecializationTransitive();
  assert.equal(authoritative.ok, transitive.ok);
});

test("auditAntiSpecializationFiles detects injected probe with exact markers", () => {
  const probe = path.join(os.tmpdir(), `vcck-anti-spec-probe-${process.pid}.js`);
  fs.writeFileSync(
    probe,
    'import x from "./234-N09-lotb-chapter.js";\nexport const validateMm2AgainstN09 = x;\n',
  );
  try {
    const r = auditAntiSpecializationFiles([probe]);
    assert.equal(r.ok, false);
    assert.equal(r.violations.length >= 2, true);
    assert.ok(r.violations.some((v) => v.file.includes(path.basename(probe))));
    assert.ok(r.violations.some((v) => v.pattern));
    const authoritative = auditAntiSpecialization();
    assert.equal(authoritative.ok, true);
  } finally {
    fs.unlinkSync(probe);
  }
});
