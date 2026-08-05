import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { gateBeforeRender } from "../lib/vcck/signature-analyzer.js";
import { checkBudgets, resolveBudgets } from "../lib/vcck/budgets.js";
import { renderVcckSpec } from "../lib/vcck/render-bridge.js";
import {
  CONTROL,
  FIXTURE_STATUS,
  deriveMissionVerdict,
  assertReportCoherence,
  aggregateControl,
  controlNotExecuted,
  browserUnavailableStatus,
  strictPositiveControlsPass,
  strictNegativeControlsPass,
  isFavorableControlValue,
} from "../lib/vcck/status.js";
import {
  validateSvgGeometryIndependent,
  validateMutantFixtures,
  MUTANT_DIAGONAL_THROUGH_NODE,
  MUTANT_DIAGONAL_X_CROSS,
} from "../lib/vcck/svg-geom-independent.js";
import {
  auditAntiSpecializationTransitive,
  collectTransitiveClosure,
  VCCK_ENTRY_POINTS,
} from "../lib/vcck/anti-specialization.js";
import { runNegativeFixture, runVcckQualification } from "../lib/vcck/pipeline.js";
import {
  runAllRejectFixtures,
  runRejectFixture,
  computeRejectFixturesOk,
  isRejectProofPass,
} from "../lib/vcck/reject-fixtures.js";
import { computeVcckVerdict, isInterProcessDeterminismOk } from "../lib/vcck/verdict.js";
import { loadFamilyRegistry } from "../lib/vcck/registry.js";
import { assertRegistryQualificationContract } from "../lib/vcck/w1-qualification.js";
import {
  VCCK_NEGATIVE,
  VCCK_REJECT,
  VCCK_POSITIVE,
  VCCK_SNAPSHOTS,
  VCCK_AUTHORITATIVE_DIRS,
  resetVcckOutputDir,
} from "../lib/vcck/paths.js";
import { loadVcckInventory } from "../lib/vcck/inventory.js";
import { inventoryAllSurfaces } from "../lib/vcck/surfaces.js";
import { buildGallery, buildGalleryHtml } from "../lib/vcck/gallery.js";
import { checkInterProcessDeterminism, verifyRenderSnapshots } from "../lib/vcck/determinism-ipc.js";
import { w1ApprovedFixturePaths } from "../lib/vcck/w1-snapshots.js";

// ── P0.1-B strict PASS tests ─────────────────────────────────────────────

const NON_PASS_VALUES = [CONTROL.BLOCKED, CONTROL.N_A, "SKIP", CONTROL.FAIL, "UNKNOWN"];

for (const bad of NON_PASS_VALUES) {
  test(`P0.1-B — ${bad} blocks strictPositiveControlsPass`, () => {
    const row = {
      recognition: CONTROL.PASS,
      fixtureValidation: CONTROL.PASS,
      render: CONTROL.PASS,
      viewports: CONTROL.PASS,
      surfaces: CONTROL.PASS,
      determinism: bad,
    };
    assert.equal(strictPositiveControlsPass(row), false);
    assert.equal(isFavorableControlValue(bad), false);
  });
}

test("P0.1-B — strict positive requires all PASS", () => {
  assert.equal(
    strictPositiveControlsPass({
      recognition: CONTROL.PASS,
      fixtureValidation: CONTROL.PASS,
      render: CONTROL.PASS,
      viewports: CONTROL.PASS,
      surfaces: CONTROL.PASS,
      determinism: CONTROL.PASS,
    }),
    true,
  );
});

test("P0.1-B — strict negative requires REJECTED + PASS + matching code", () => {
  assert.equal(
    strictNegativeControlsPass({
      recognition: "REJECTED",
      negative: CONTROL.PASS,
      code: "UNSUPPORTED_TOPOLOGY",
      expectedCode: "UNSUPPORTED_TOPOLOGY",
    }),
    true,
  );
  assert.equal(
    strictNegativeControlsPass({
      recognition: "UNEXPECTED_PASS",
      negative: CONTROL.PASS,
      code: "X",
      expectedCode: "X",
    }),
    false,
  );
});

// ── P0.1-A reject fixtures connected to verdict ──────────────────────────

test("P0.1-A — computeRejectFixturesOk requires all nine strict conditions", () => {
  const allPass = runAllRejectFixtures({ inventory: loadVcckInventory() });
  assert.equal(allPass.length, 9);
  assert.ok(allPass.every(isRejectProofPass), JSON.stringify(allPass.filter((r) => !isRejectProofPass)));
  assert.equal(computeRejectFixturesOk(allPass), true);
});

test("P0.1-A — single reject failure blocks verdict", () => {
  const bundle = computeVcckVerdict({
    rejectResults: [{ negative: CONTROL.FAIL, renderBlocked: false, code: "X", expectedCode: "Y" }],
    detailRows: [],
    coherence: { ok: true },
    antiSpec: { ok: true },
    mutants: { ok: true },
    surfaces: { ok: false },
    interProcessDeterminism: { ok: true, skipped: false },
    dryRun: false,
  });
  assert.equal(bundle.rejectFixturesOk, false);
  assert.equal(bundle.proofHarnessReady, false);
  assert.equal(bundle.missionVerdict, "VCCK_P0_BLOCKED");
});

test("P0.1-A — reject results included in qualification dry-run return", async () => {
  const rejects = runAllRejectFixtures({ inventory: loadVcckInventory() });
  const r = await runVcckQualification({ dryRun: true, rejectResults: rejects });
  assert.ok(r.rejectResults);
  assert.equal(r.rejectResults.length, 9);
  assert.equal(typeof r.rejectFixturesOk, "boolean");
});

// ── P0.1-C post-recognition family budget ────────────────────────────────

test("P0.1-C — primitive envelope passes, family budget rejects", () => {
  const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dual-context-short.yaml"));
  const primitiveCheck = checkBudgets(spec);
  assert.equal(primitiveCheck.ok, true, JSON.stringify(primitiveCheck.detail));
  const familyCheck = checkBudgets(spec, { familyId: "single-context" });
  assert.equal(familyCheck.ok, false);
  assert.equal(familyCheck.code, "BUDGET_EXCEEDED");
  assert.equal(familyCheck.detail.field, "maxContexts");
});

test("P0.1-C — pipeline applies family budget after recognition match", async () => {
  const { runPositiveFixture } = await import("../lib/vcck/pipeline.js");
  const reg = loadFamilyRegistry();
  const family = reg.families.find((f) => f.id === "dual-context");
  const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dual-context-short.yaml"));
  assert.equal(checkBudgets(spec).ok, true);
  assert.equal(checkBudgets(spec, { familyId: "dual-context" }).ok, true);
  assert.equal(checkBudgets(spec, { familyId: "single-context" }).ok, false);

  const r = await runPositiveFixture(family, path.join(VCCK_POSITIVE, "dual-context-short.yaml"), {
    inventory: loadVcckInventory(),
    dryRun: true,
  });
  assert.equal(r.recognition, CONTROL.PASS);
  assert.ok(!r.code);
});

// ── P0.1-D real anti-specialization negative test ─────────────────────────

test("P0.1-D — forbidden token in temp module detected", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vcck-audit-"));
  const poison = path.join(tmpDir, "poison-N09-module.js");
  fs.writeFileSync(poison, 'export const x = "reference to N09 in corpus 234";\n');
  const entry = path.join(tmpDir, "entry.js");
  fs.writeFileSync(entry, `import "./poison-N09-module.js";\nexport const ok = true;\n`);

  const audit = auditAntiSpecializationTransitive({ entryPoints: [entry] });
  assert.equal(audit.ok, false);
  assert.ok(audit.violations.length > 0);
  assert.ok(audit.violations.some((v) => v.file.includes("poison-N09-module.js")));
  assert.ok(audit.violations.some((v) => v.pattern.includes("N09") || v.kind === "content"));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("P0.1-D — forbidden filename detected", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vcck-fname-"));
  const poison = path.join(tmpDir, "lotb-chapter-helper.js");
  fs.writeFileSync(poison, "export const clean = true;\n");
  const audit = auditAntiSpecializationTransitive({ entryPoints: [poison] });
  assert.equal(audit.ok, false);
  assert.ok(audit.violations.some((v) => v.kind === "filename"));
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── P0.1-E no authoritative writes on dry-run ────────────────────────────

function dirFingerprint(dir) {
  if (!fs.existsSync(dir)) return { exists: false, files: [] };
  const files = [];
  const walk = (d, prefix = "") => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(path.join(d, ent.name), rel);
      else files.push({ path: rel, mtime: fs.statSync(path.join(d, ent.name)).mtimeMs });
    }
  };
  walk(dir);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return { exists: true, files };
}

function fingerprintAuthoritative() {
  return Object.fromEntries(VCCK_AUTHORITATIVE_DIRS.map((d) => [d, dirFingerprint(d)]));
}

test("P0.1-E — dry-run qualification does not mutate authoritative dirs", async () => {
  const before = fingerprintAuthoritative();
  await runVcckQualification({ dryRun: true, rejectResults: runAllRejectFixtures() });
  const gallery = buildGallery({ familyResults: {} }, { write: false });
  assert.equal(gallery.written, false);
  assert.ok(buildGalleryHtml(null).includes("VCCK Gallery"));
  const after = fingerprintAuthoritative();
  assert.deepEqual(after, before);
  resetVcckOutputDir();
});

// ── P0.2 IPC strict gate ─────────────────────────────────────────────────

test("P0.2 — IPC skipped=true blocks proofHarnessReady", () => {
  assert.equal(isInterProcessDeterminismOk({ skipped: true, ok: true }), false);
  const b = computeVcckVerdict({
    rejectResults: [],
    detailRows: [],
    coherence: { ok: true },
    antiSpec: { ok: true },
    mutants: { ok: true },
    surfaces: { ok: false },
    interProcessDeterminism: { skipped: true, ok: true },
    dryRun: true,
  });
  assert.equal(b.proofHarnessReady, false);
});

test("P0.2 — IPC absent blocks proofHarnessReady", () => {
  assert.equal(isInterProcessDeterminismOk(undefined), false);
  assert.equal(isInterProcessDeterminismOk({ ok: false }), false);
});

test("P0.2 — IPC ok=false blocks proofHarnessReady", () => {
  assert.equal(isInterProcessDeterminismOk({ skipped: false, ok: false }), false);
});

test("P0.2 — IPC ok=true skipped=false is favorable", () => {
  assert.equal(isInterProcessDeterminismOk({ skipped: false, ok: true }), true);
});

test("P0.2 — dry-run with IPC executed can set proofHarnessReady", async () => {
  const rejects = runAllRejectFixtures({ inventory: loadVcckInventory() });
  const r = await runVcckQualification({ dryRun: true, rejectResults: rejects, checkInterProcessDeterminism: true });
  assert.equal(r.interProcessDeterminism.skipped, false);
  assert.equal(r.interProcessDeterminism.ok, true);
  assert.equal(r.proofHarnessReady, true);
  assert.equal(r.missionVerdict, "VCCK_P0_BLOCKED");
});

// ── P0.1-F inter-process determinism ─────────────────────────────────────

test("P0.1-F — inter-process determinism chain-short", () => {
  const fixture = path.join(VCCK_POSITIVE, "chain-short.yaml");
  const r = checkInterProcessDeterminism(fixture);
  assert.equal(r.ok, true, r.errors?.join("; "));
  assert.equal(r.hashA, r.hashB);
  assert.equal(r.bytesMatch, true);
});

test("P0.1-F — verify snapshots never writes", () => {
  const snapPath = path.join(VCCK_SNAPSHOTS, "render-hashes.json");
  const fixtures = w1ApprovedFixturePaths();
  const beforeMtime = fs.existsSync(snapPath) ? fs.statSync(snapPath).mtimeMs : null;
  const beforeContent = fs.existsSync(snapPath) ? fs.readFileSync(snapPath, "utf8") : null;
  const r = verifyRenderSnapshots(fixtures, { snapshotPath: snapPath });
  if (fs.existsSync(snapPath) && beforeMtime != null) {
    assert.equal(fs.statSync(snapPath).mtimeMs, beforeMtime);
    assert.equal(fs.readFileSync(snapPath, "utf8"), beforeContent);
  }
  assert.equal(r.ok, true, r.errors?.join("; "));
  assert.equal(r.results.length, 8);
});

// ── P0.1-G word surface clarification ────────────────────────────────────

test("P0.1-G — word candidate tracked separately from surfaces PASS", () => {
  const reg = loadFamilyRegistry();
  const inv = inventoryAllSurfaces(reg);
  for (const e of inv.entries) {
    assert.equal(e.wordRenderExecuted, false);
    assert.equal(e.wordProofValidated, false);
  }
});

// ── retained P0 tests ────────────────────────────────────────────────────

test("P0.1 — SKIP never promotes to PASS in aggregateControl", () => {
  assert.equal(aggregateControl([{ viewports: "SKIP" }, { viewports: CONTROL.PASS }], "viewports"), CONTROL.BLOCKED);
});

test("P0.1 — dry-run controls are BLOCKED not SKIP", () => {
  assert.equal(controlNotExecuted(), CONTROL.BLOCKED);
  assert.equal(browserUnavailableStatus(), CONTROL.BLOCKED);
});

test("P0.2 — negative passes only via authentic gate reject", async () => {
  const reg = loadFamilyRegistry();
  const family = reg.families.find((f) => f.id === "chain");
  const r = await runNegativeFixture(family, path.join(VCCK_NEGATIVE, "chain-negative.yaml"), {
    expectedCode: "UNSUPPORTED_TOPOLOGY",
    inventory: loadVcckInventory(),
  });
  assert.equal(r.negative, CONTROL.PASS);
  assert.equal(r.status, FIXTURE_STATUS.PROOF_PASS);
});

const REJECT_CODES = [
  ["reject-unsupported-topology.yaml", "UNSUPPORTED_TOPOLOGY"],
  ["reject-non-planar.yaml", "NON_PLANAR_REQUIRED_CROSSING"],
  ["reject-budget-exceeded.yaml", "BUDGET_EXCEEDED"],
  ["reject-ambiguous-edge.yaml", "AMBIGUOUS_EDGE_ORIGIN"],
  ["reject-unsupported-nesting.yaml", "UNSUPPORTED_NESTING"],
  ["reject-temporal-as-causal.yaml", "TEMPORAL_AS_CAUSAL"],
  ["reject-unlabelled-branch.yaml", "UNLABELLED_DECISION_BRANCH"],
  ["reject-missing-terminal.yaml", "MISSING_TERMINAL"],
  ["reject-text-load.yaml", "UNSUPPORTED_TEXT_LOAD"],
];

for (const [file, code] of REJECT_CODES) {
  test(`P0.8 — reject fixture ${code}`, () => {
    const r = runRejectFixture(path.join(VCCK_REJECT, file), code, { inventory: loadVcckInventory() });
    assert.equal(r.negative, CONTROL.PASS, r.errors?.join("; "));
    assert.equal(r.renderBlocked, true);
    assert.equal(r.code, code);
    assert.ok(isRejectProofPass({ ...r, expectedCode: code, file }));
  });
}

test("registry qualification matrix: 4 QUALIFIED, 14 EXPERIMENTAL, 0 FROZEN", () => {
  const check = assertRegistryQualificationContract(loadFamilyRegistry({ reload: true }));
  assert.equal(check.ok, true, check.errors.join("; "));
});

test("P0.6 — dry-run mission verdict always blocked", () => {
  assert.equal(deriveMissionVerdict({ proofHarnessReady: true, surfacesComplete: true, dryRun: true }), "VCCK_P0_BLOCKED");
});

test("P0.7 — surface inventory expects 216 artifacts", () => {
  const inv = inventoryAllSurfaces(loadFamilyRegistry());
  assert.equal(inv.expectedTotal, 216);
  assert.equal(inv.entries.length, 36);
});

test("transitive anti-specialization passes on VCCK closure", () => {
  assert.equal(auditAntiSpecializationTransitive().ok, true);
});

test("mutants fail independent geometry", () => {
  assert.equal(validateSvgGeometryIndependent(MUTANT_DIAGONAL_X_CROSS.svg).ok, false);
  assert.equal(validateMutantFixtures().ok, true);
});
