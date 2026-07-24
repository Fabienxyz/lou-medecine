import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateInventory } from "../lib/inventory.js";
import { reconcile } from "../lib/reconcile.js";
import { parseBlueprint, validateBlueprint } from "../lib/blueprint.js";
import {
  loadAllProjectionClaimsSync,
  assembleTraceability,
  discoverProjectionFiles,
} from "../lib/claims.js";
import {
  collectElementsWithVisualIntent,
} from "../lib/blueprint.js";
import {
  groundDeterministic,
  mergeSemanticGrounding,
} from "../lib/ground.js";
import { renderSvg, SUPPORTED_VISUAL_INTENTS } from "../lib/svg.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function writeFile(dir, rel, content) {
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

test("inventory validator accepts arbitrary KP count without OAP assumptions", () => {
  const kps = [];
  for (let i = 1; i <= 12; i++) {
    kps.push({
      id: `KP-${String(i).padStart(3, "0")}`,
      label: `Fact ${i}`,
      disposition: i % 3 === 0 ? "deferred-to-mastery" : "understanding",
      anchors: [{ section_path: "II. Diagnostic", quote: `unique quote number ${i} xyz` }],
    });
  }
  const result = validateInventory({ chapter: "cardio/999", kps });
  assert.equal(result.ok, true);
  assert.equal(result.ids.length, 12);
});

test("reconciliation required segments come from artifact configuration", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-recon-"));
  const reconPath = path.join(dir, "reconciliation.yaml");
  writeFile(
    dir,
    "reconciliation.yaml",
    `
scope: test-scope
required_segment_ids: [seg-alpha, seg-beta]
status: pass
segments:
  - id: seg-alpha
    disposition: represented
    kp: [KP-001]
  - id: seg-beta
    disposition: represented
    kp: [KP-002]
`
  );
  const ok = reconcile({ reconciliationPath: reconPath });
  assert.equal(ok.ok, true);

  writeFile(
    dir,
    "reconciliation.yaml",
    `
scope: test-scope
required_segment_ids: [seg-alpha, seg-missing]
status: pass
segments:
  - id: seg-alpha
    disposition: represented
    kp: [KP-001]
`
  );
  const missing = reconcile({ reconciliationPath: reconPath });
  assert.equal(missing.ok, false);
  assert.match(missing.errors.join("; "), /seg-missing/);
});

test("reconciliation empty and missed required segments fail", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-recon-fail-"));
  const reconPath = path.join(dir, "reconciliation.yaml");

  writeFile(
    dir,
    "reconciliation.yaml",
    `
scope: test
required_segment_ids: [seg-a]
status: pass
segments: []
`
  );
  assert.equal(reconcile({ reconciliationPath: reconPath }).ok, false);

  writeFile(
    dir,
    "reconciliation.yaml",
    `
scope: test
required_segment_ids: [seg-a]
status: pass
segments:
  - id: seg-a
    disposition: missed
    kp: []
`
  );
  const missed = reconcile({ reconciliationPath: reconPath });
  assert.equal(missed.ok, false);
  assert.match(missed.errors.join("; "), /missed/);
});

test("blueprint validation accepts non-OAP clinical-reasoning element", () => {
  const raw = `---
chapter: cardio/test
sequence: [CR-sample]
clinical_reasoning:
  - id: CR-sample
    question: "Sample clinical question?"
    uses_kp: [KP-010]
---
`;
  const bp = parseBlueprint("blueprint.md", raw);
  const result = validateBlueprint(bp, new Set(["KP-010"]));
  assert.equal(result.ok, true);
  assert.ok(result.clinicalReasoning.length === 1);
});

test("projection discovery supports more than two configured projections", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-proj-"));
  writeFile(
    dir,
    "projections.yaml",
    `
projections:
  - id: a
    type: understanding.story
    order: 1
    path: projections/understanding/a.md
  - id: b
    type: understanding.overview
    order: 2
    path: projections/understanding/b.md
  - id: c
    type: understanding.mechanisms
    order: 3
    path: projections/understanding/c.md
`
  );
  const discovered = discoverProjectionFiles(dir);
  assert.equal(discovered.ok, true);
  assert.equal(discovered.files.length, 3);
});

test("claim-trace assembly works across multiple projection files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-claims-"));
  const inventory = {
    chapter: "cardio/test",
    kps: [
      {
        id: "KP-001",
        label: "One",
        disposition: "understanding",
        anchors: [{ quote: "q1", section_path: "II. Diagnostic" }],
      },
      {
        id: "KP-002",
        label: "Two",
        disposition: "understanding",
        anchors: [{ quote: "q2", section_path: "II. Diagnostic" }],
      },
    ],
  };
  writeFile(
    dir,
    "projections.yaml",
    `
projections:
  - id: one
    type: understanding.overview
    order: 1
    path: projections/understanding/one.md
  - id: two
    type: understanding.mechanisms
    order: 2
    path: projections/understanding/two.md
`
  );
  writeFile(
    dir,
    "projections/understanding/one.md",
    `Claim one. {#cb-one}
<!-- claim-trace
claims:
  - id: cb-one
    class: sourced
    kp: [KP-001]
-->`
  );
  writeFile(
    dir,
    "projections/understanding/two.md",
    `Claim two. {#cb-two}
<!-- claim-trace
claims:
  - id: cb-two
    class: bridging
    element: CR-x
    kp: [KP-002]
-->`
  );

  const loaded = loadAllProjectionClaimsSync(dir, inventory);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.allClaims.length, 2);

  const trace = assembleTraceability(loaded.allClaims, inventory, {
    edition: "2024-SFC",
  });
  assert.ok(trace["cb-one"]);
  assert.ok(trace["cb-two"]);
  assert.deepEqual(trace["cb-two"].kp, ["KP-002"]);
});

test("multiple visual-capable blueprint elements are discoverable", () => {
  const data = {
    mechanisms: [
      { id: "MEC-a", visual_intent: "process-flow", steps: ["a"], uses_kp: [] },
      { id: "MEC-b", visual_intent: "comparison", steps: ["b"], uses_kp: [] },
    ],
    clinical_reasoning: [
      { id: "CR-a", visual_intent: "algorithm", question: "q", uses_kp: [] },
    ],
  };
  const elements = collectElementsWithVisualIntent(data);
  assert.equal(elements.length, 3);
});

test("unsupported visual intent fails honestly", () => {
  assert.equal(SUPPORTED_VISUAL_INTENTS.has("comparison"), false);
  const result = renderSvg({
    element: "MEC-b",
    intent: "comparison",
    question: "Compare",
    steps: [{ n: 1, label: "a", highlight: null }],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("; "), /unsupported visual_intent/);
});

test("semantic grounding cannot auto-pass arbitrary bridging claims via bootstrap allowlist", () => {
  const det = { ok: true, errors: [], verdicts: {}, status: "pass" };
  const projectionResults = [
    {
      claims: [
        { id: "cb-oap-bridge", class: "bridging" },
        { id: "cb-new-bridging-claim", class: "bridging" },
      ],
    },
  ];
  const merged = mergeSemanticGrounding(det, {
    projectionResults,
    packageConfig: {
      semantic_grounding_bootstrap: {
        allowed_claim_ids: ["cb-oap-bridge"],
        verdicts: {
          "cb-oap-bridge": { status: "pass", note: "allowed only" },
        },
      },
    },
  });
  assert.equal(merged.ok, false);
  assert.equal(merged.verdicts["cb-oap-bridge"].status, "pass");
  assert.equal(merged.verdicts["cb-new-bridging-claim"].status, "pending");
});
