#!/usr/bin/env node
/**
 * Deterministic Phase-4 Blueprint audit against the canonical Inventory.
 * Exit 0 = GO (no missed understanding KPs, OAP intact, IDs valid).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  parseBlueprint,
  validateBlueprint,
  collectBlueprintElementIds,
} from "../../../../../tools/lou-build/lib/blueprint.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAPTER = path.resolve(__dirname, "..");
const require = createRequire(
  path.resolve(__dirname, "../../../../../tools/lou-build/package.json")
);
const YAML = require("yaml");

const OAP_REQUIRED = {
  mechanisms: ["MEC-congestion", "MEC-oap"],
  confusion: ["CONF-transsudat-exsudat"],
  kps: ["KP-040", "KP-041", "KP-042"],
};

function loadInventory() {
  return YAML.parse(
    fs.readFileSync(path.join(CHAPTER, "inventory.yaml"), "utf8")
  );
}

function collectUsesKp(data) {
  const map = new Map(); // kp -> [elementIds]
  const touch = (elId, kps) => {
    for (const kp of kps || []) {
      if (!map.has(kp)) map.set(kp, []);
      map.get(kp).push(elId);
    }
  };
  for (const mec of data.mechanisms || []) touch(mec.id, mec.uses_kp);
  for (const cr of data.clinical_reasoning || []) touch(cr.id, cr.uses_kp);
  for (const conf of data.confusion || []) touch(conf.id, conf.uses_kp);
  for (const ana of data.analogies || []) touch(ana.id, ana.uses_kp);
  return map;
}

function findElement(data, id) {
  if (data.mental_model === id) return { id, kind: "mental_model" };
  for (const mec of data.mechanisms || []) if (mec.id === id) return { ...mec, kind: "mechanism" };
  for (const cr of data.clinical_reasoning || []) if (cr.id === id) return { ...cr, kind: "clinical_reasoning" };
  for (const conf of data.confusion || []) if (conf.id === id) return { ...conf, kind: "confusion" };
  for (const ana of data.analogies || []) if (ana.id === id) return { ...ana, kind: "analogy" };
  return null;
}

function audit() {
  const errors = [];
  const warnings = [];
  const inventory = loadInventory();
  const raw = fs.readFileSync(path.join(CHAPTER, "blueprint.md"), "utf8");
  const blueprint = parseBlueprint(path.join(CHAPTER, "blueprint.md"), raw);
  const data = blueprint.data;
  const invIds = new Set((inventory.kps || []).map((k) => k.id));

  const bpVal = validateBlueprint(blueprint, invIds);
  if (!bpVal.ok) errors.push(...bpVal.errors.map((e) => `schema: ${e}`));

  // Duplicate Blueprint IDs
  const seen = new Map();
  for (const id of collectBlueprintElementIds(data)) {
    seen.set(id, (seen.get(id) || 0) + 1);
  }
  // collectBlueprintElementIds uses a Set — re-scan lists for duplicates
  const allIds = [];
  if (data.mental_model) allIds.push(data.mental_model);
  for (const list of [
    data.mechanisms,
    data.clinical_reasoning,
    data.confusion,
    data.analogies,
  ]) {
    for (const el of list || []) if (el.id) allIds.push(el.id);
  }
  const counts = {};
  for (const id of allIds) counts[id] = (counts[id] || 0) + 1;
  for (const [id, n] of Object.entries(counts)) {
    if (n > 1) errors.push(`duplicate Blueprint id: ${id}`);
  }

  // No CAND IDs
  const blob = JSON.stringify(data);
  if (/CAND-/.test(blob) || /CAND-/.test(raw)) {
    errors.push("CAND-* identifier present in Blueprint");
  }

  // OAP regression
  for (const id of OAP_REQUIRED.mechanisms) {
    const mec = (data.mechanisms || []).find((m) => m.id === id);
    if (!mec) errors.push(`OAP regression: missing ${id}`);
  }
  const mecCong = (data.mechanisms || []).find((m) => m.id === "MEC-congestion");
  const mecOap = (data.mechanisms || []).find((m) => m.id === "MEC-oap");
  const confTx = (data.confusion || []).find((c) => c.id === "CONF-transsudat-exsudat");
  if (mecCong && !(mecCong.uses_kp || []).includes("KP-040")) {
    errors.push("OAP regression: MEC-congestion must use KP-040");
  }
  if (mecOap && !(mecOap.uses_kp || []).includes("KP-041")) {
    errors.push("OAP regression: MEC-oap must use KP-041");
  }
  if (mecOap?.visual_intent !== "process-flow") {
    errors.push("OAP regression: MEC-oap must keep visual_intent: process-flow");
  }
  if (!confTx) errors.push("OAP regression: missing CONF-transsudat-exsudat");
  else {
    for (const kp of ["KP-041", "KP-042"]) {
      if (!(confTx.uses_kp || []).includes(kp)) {
        errors.push(`OAP regression: CONF-transsudat-exsudat must use ${kp}`);
      }
    }
  }
  if (mecOap && !/25\s*mmHg/i.test(JSON.stringify(mecOap.steps || []))) {
    errors.push("OAP regression: MEC-oap steps must retain >25 mmHg threshold concept");
  }
  if (!/PPC > 25 mmHg/.test(raw)) {
    errors.push("OAP regression: body/frontmatter must retain PPC > 25 mmHg wording");
  }

  // Known ambiguities must remain explicit
  if (!(data.confusion || []).some((c) => c.id === "CONF-ccb-fe-source")) {
    errors.push("ambiguity: CONF-ccb-fe-source missing");
  }
  if (!(data.confusion || []).some((c) => c.id === "CONF-bb-chronic-vs-acute")) {
    errors.push("ambiguity: CONF-bb-chronic-vs-acute missing");
  }

  // Sequence integrity already in validateBlueprint; also ensure mental model present
  if (data.mental_model !== "MM-pump-decompensation") {
    errors.push("mental_model must be MM-pump-decompensation");
  }
  if (!(data.sequence || []).includes("MM-pump-decompensation")) {
    errors.push("sequence must include MM-pump-decompensation");
  }

  // Coverage
  const uses = collectUsesKp(data);
  const understanding = (inventory.kps || []).filter(
    (k) => k.disposition === "understanding"
  );
  const deferred = (inventory.kps || []).filter(
    (k) => k.disposition === "deferred-to-mastery"
  );
  const excluded = (inventory.kps || []).filter(
    (k) => k.disposition === "excluded-with-justification"
  );

  // Contextual-only understanding KPs (honest non-uses_kp representation)
  // None expected if mapping is complete via uses_kp; keep hook for future.
  const contextualOnly = new Set([]);
  const intentionallyNotPromoted = new Map(); // none for understanding in this phase

  const direct = [];
  const contextual = [];
  const notPromoted = [];
  const missed = [];

  for (const kp of understanding) {
    if (uses.has(kp.id)) direct.push(kp.id);
    else if (contextualOnly.has(kp.id)) contextual.push(kp.id);
    else if (intentionallyNotPromoted.has(kp.id)) {
      notPromoted.push({ id: kp.id, reason: intentionallyNotPromoted.get(kp.id) });
    } else missed.push(kp.id);
  }

  if (missed.length) {
    errors.push(
      `coverage NO-GO: missed understanding KPs: ${missed.join(", ")}`
    );
  }

  // Compression heuristics
  const singletonElements = [];
  for (const mec of data.mechanisms || []) {
    if ((mec.uses_kp || []).length === 1 && !["MEC-congestion", "MEC-oap", "MEC-systemic-congestion"].includes(mec.id)) {
      singletonElements.push(mec.id);
    }
  }
  for (const id of singletonElements) {
    warnings.push(`compression: singleton mechanism ${id} (review if groupable)`);
  }

  // Inventory-like 1:1 (element count ≈ understanding count) — soft check
  const elementCount = allIds.length;
  if (elementCount > 40) {
    warnings.push(`compression: element count ${elementCount} looks Inventory-like`);
  }
  if (elementCount < 12) {
    warnings.push(`compression: element count ${elementCount} may be over-compressed`);
  }

  // Giant unrelated bags — soft: CR with >25 KPs
  for (const cr of data.clinical_reasoning || []) {
    if ((cr.uses_kp || []).length > 25) {
      warnings.push(`compression: ${cr.id} maps ${(cr.uses_kp || []).length} KPs — check coherence`);
    }
  }

  // Cognitive sequence: treatment after mechanism prerequisites
  const seq = data.sequence || [];
  const idx = (id) => seq.indexOf(id);
  const prereqPairs = [
    ["MEC-output-basics", "MEC-compensation"],
    ["MEC-compensation", "MEC-remodeling"],
    ["MEC-congestion", "MEC-oap"],
    ["MEC-oap", "CR-acute"],
    ["MEC-ef-phenotypes", "CR-treat-hfref"],
    ["MEC-ef-phenotypes", "CR-treat-hfpef"],
    ["CR-recognize", "CR-diagnose"],
    ["CR-diagnose", "CR-etiology"],
    ["CR-acute", "CR-treat-hfref"],
  ];
  for (const [a, b] of prereqPairs) {
    if (idx(a) === -1 || idx(b) === -1) continue;
    if (idx(a) > idx(b)) {
      errors.push(`sequence: ${a} should precede ${b}`);
    }
  }

  // Dangling KP refs already in validateBlueprint; also flag non-inventory
  for (const [kp, els] of uses) {
    if (!invIds.has(kp)) errors.push(`dangling KP ${kp} via ${els.join(",")}`);
  }

  // Type counts
  const breakdown = {
    mental_model: data.mental_model ? 1 : 0,
    analogies: (data.analogies || []).length,
    mechanisms: (data.mechanisms || []).length,
    clinical_reasoning: (data.clinical_reasoning || []).length,
    confusion: (data.confusion || []).length,
  };

  const activeVisuals = [
    ...(data.mechanisms || []),
    ...(data.clinical_reasoning || []),
  ]
    .filter((e) => e.visual_intent)
    .map((e) => ({ element: e.id, intent: e.visual_intent, active: true }));

  const result = {
    ok: errors.length === 0,
    errors,
    warnings,
    element_count: elementCount,
    breakdown,
    sequence: seq,
    coverage: {
      understanding_total: understanding.length,
      directly_mapped: direct.length,
      contextual: contextual.length,
      intentionally_not_promoted: notPromoted.length,
      missed: missed.length,
      direct_ids: direct,
      contextual_ids: contextual,
      not_promoted: notPromoted,
      missed_ids: missed,
    },
    deferred_not_promoted: deferred.map((k) => ({
      id: k.id,
      label: String(k.label).replace(/\s+/g, " ").slice(0, 120),
    })),
    excluded: excluded.map((k) => k.id),
    oap: {
      mechanisms: OAP_REQUIRED.mechanisms.every((id) => findElement(data, id)),
      confusion: !!confTx,
      kps: OAP_REQUIRED.kps.every((kp) => uses.has(kp)),
      threshold_25: /PPC > 25 mmHg/.test(raw),
      mec_oap_visual: mecOap?.visual_intent === "process-flow",
    },
    ambiguities: {
      ccb_fe: !!(data.confusion || []).find((c) => c.id === "CONF-ccb-fe-source"),
      bb_context: !!(data.confusion || []).find(
        (c) => c.id === "CONF-bb-chronic-vs-acute"
      ),
    },
    visual_intent_active: activeVisuals,
    visual_plan: data.visual_plan || [],
    verdict: errors.length === 0 ? "GO" : "NO-GO",
  };

  return result;
}

const result = audit();
const outPath = path.join(__dirname, "blueprint-phase4-validation.json");
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      verdict: result.verdict,
      element_count: result.element_count,
      breakdown: result.breakdown,
      coverage: {
        understanding_total: result.coverage.understanding_total,
        directly_mapped: result.coverage.directly_mapped,
        contextual: result.coverage.contextual,
        missed: result.coverage.missed,
        missed_ids: result.coverage.missed_ids,
      },
      oap: result.oap,
      ambiguities: result.ambiguities,
      errors: result.errors,
      warnings: result.warnings,
    },
    null,
    2
  )
);

process.exit(result.ok ? 0 : 1);
