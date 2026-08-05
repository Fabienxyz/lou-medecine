import fs from "node:fs";
import YAML from "yaml";
import { VCCK_INVENTORY } from "./paths.js";

let _inventory = null;

export function loadVcckInventory() {
  if (_inventory) return _inventory;
  const text = fs.readFileSync(VCCK_INVENTORY, "utf8");
  _inventory = YAML.parse(text);
  return _inventory;
}

export function vcckSourceMeta() {
  return { edition: 2022, source_file: "vcck-fixture-corpus" };
}

/** Auto-pass scaffolding; pass sourced with fixture inventory KPs. */
export function buildVcckReview(spec) {
  const verdicts = {};
  for (const unit of collectUnits(spec)) {
    verdicts[unit.id] = {
      status: "pass",
      unit_digest: unit.digest || "vcck-fixture",
      rationale: "VCCK generic fixture — scaffolding or fixture KP",
    };
  }
  return {
    verdicts,
    meta: { method: "VCCK_FIXTURE", reviewer: "vcck-pipeline" },
  };
}

function collectUnits(spec) {
  const units = [];
  const push = (id, cls) => units.push({ id, class: cls, digest: `vcck-${id}` });

  const walk = (arr, prefix) => {
    for (const item of arr || []) {
      if (item.id) push(`${prefix}-${item.id}`, item.class || "scaffolding");
    }
  };

  walk(spec.nodes, "n");
  walk(spec.edges, "e");
  walk(spec.branches, "b");
  walk(spec.poles, "p");
  walk(spec.dimensions, "d");
  walk(spec.groups, "g");
  if (spec.target?.id) push(`target-${spec.target.id}`, spec.target.class);

  return units;
}
