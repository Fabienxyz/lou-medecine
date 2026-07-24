import YAML from "yaml";

const VALID_DISPOSITIONS = new Set([
  "understanding",
  "deferred-to-mastery",
  "excluded-with-justification",
]);

export function validateInventory(inventory, options = {}) {
  const errors = [];
  const ids = new Set();
  const requireSlice = options.requireSlice === true;

  if (!inventory.chapter) errors.push("missing chapter");
  if (requireSlice && !inventory.slice) {
    errors.push("missing slice identifier");
  }
  if (!Array.isArray(inventory.kps) || inventory.kps.length === 0) {
    errors.push("kps must be a non-empty array");
  }

  for (const kp of inventory.kps || []) {
    if (!kp.id) {
      errors.push("KP missing id");
      continue;
    }
    if (ids.has(kp.id)) {
      errors.push(`duplicate KP id: ${kp.id}`);
    }
    ids.add(kp.id);

    if (!kp.label) errors.push(`${kp.id}: missing label`);
    if (!kp.disposition) {
      errors.push(`${kp.id}: missing disposition`);
    } else if (
      !VALID_DISPOSITIONS.has(kp.disposition) &&
      !String(kp.disposition).startsWith("excluded:")
    ) {
      errors.push(`${kp.id}: invalid disposition ${kp.disposition}`);
    }
    if (!Array.isArray(kp.anchors) || kp.anchors.length === 0) {
      errors.push(`${kp.id}: requires at least one anchor`);
    }
  }

  return { ok: errors.length === 0, errors, ids: [...ids] };
}

export function inventoryById(inventory) {
  const map = new Map();
  for (const kp of inventory.kps || []) {
    map.set(kp.id, kp);
  }
  return map;
}

export function anchorForKp(kp, edition) {
  if (!kp) return null;
  const anchors = kp.anchors || [];
  const match = anchors.find((a) => !a.edition || a.edition === edition);
  return match || anchors[0];
}
