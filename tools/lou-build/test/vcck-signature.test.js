import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import {
  analyzeSignature,
  gateBeforeRender,
  signatureMatchesFamily,
} from "../lib/vcck/signature-analyzer.js";
import { VCCK_POSITIVE, VCCK_NEGATIVE } from "../lib/vcck/paths.js";

const POS = VCCK_POSITIVE;
const NEG = VCCK_NEGATIVE;

const FAMILY_FIXTURE = {
  chain: "chain-short.yaml",
  "fan-out": "fan-out-short.yaml",
  "fan-in": "fan-in-short.yaml",
  diamond: "diamond-short.yaml",
  "lateral-feedback": "lateral-feedback-short.yaml",
  "dependent-sequence": "dependent-sequence-short.yaml",
  "binary-rule-out": "binary-rule-out-short.yaml",
  "skip-level-branch": "skip-level-branch-short.yaml",
  "monitoring-loop": "monitoring-loop-short.yaml",
  "dual-context": "dual-context-short.yaml",
  "embedded-fragment": "embedded-fragment-short.yaml",
  "two-pole": "two-pole-short.yaml",
  "three-pole-reflow": "three-pole-reflow-short.yaml",
  "flat-concurrent": "flat-concurrent-short.yaml",
  "grouped-concurrent": "grouped-concurrent-short.yaml",
  identity: "identity-short.yaml",
  "two-state": "two-state-short.yaml",
};

for (const [family, file] of Object.entries(FAMILY_FIXTURE)) {
  test(`recognizes ${family} from ${file}`, () => {
    const spec = loadVisualSpec(path.join(POS, file));
    const analysis = analyzeSignature(spec);
    assert.equal(analysis.status, "recognized", JSON.stringify(analysis));
    assert.equal(analysis.family, family);
    assert.equal(signatureMatchesFamily(analysis, family), true);
  });
}

test("single-context recognized at signature layer despite schema requiring 2 contexts", () => {
  const spec = loadVisualSpec(path.join(POS, "single-context-short.yaml"));
  const analysis = analyzeSignature(spec);
  assert.equal(analysis.status, "recognized");
  assert.equal(analysis.family, "single-context");
});

test("lying composition_intent cannot force chain on fan-out topology", () => {
  const spec = loadVisualSpec(path.join(POS, "fan-out-short.yaml"));
  spec.composition_intent = "chain";
  spec.composition_family = "chain";
  spec.family_hint = "chain";
  const analysis = analyzeSignature(spec);
  assert.equal(analysis.family, "fan-out");
  assert.notEqual(analysis.family, spec.composition_intent);
});

test("K3,2 produces NON_PLANAR_REQUIRED_CROSSING and blocks render gate", () => {
  const spec = loadVisualSpec(path.join(NEG, "diamond-negative.yaml"));
  const gate = gateBeforeRender(spec);
  assert.equal(gate.allowed, false);
  assert.equal(gate.code, "NON_PLANAR_REQUIRED_CROSSING");
});

test("undeclared cycle yields TEMPORAL_AS_CAUSAL", () => {
  const spec = loadVisualSpec(path.join(NEG, "lateral-feedback-negative.yaml"));
  const analysis = analyzeSignature(spec);
  assert.equal(analysis.status, "rejected");
  assert.equal(analysis.code, "TEMPORAL_AS_CAUSAL");
});

test("binary-rule-out negative missing dead-end yields MISSING_TERMINAL", () => {
  const spec = loadVisualSpec(path.join(NEG, "binary-rule-out-negative.yaml"));
  const analysis = analyzeSignature(spec);
  assert.equal(analysis.code, "MISSING_TERMINAL");
});
