import fs from "node:fs";
import { VCCK_REGISTRY } from "./paths.js";

let _cache = null;

export function loadFamilyRegistry(options = {}) {
  if (_cache && !options.reload) return _cache;
  const raw = fs.readFileSync(VCCK_REGISTRY, "utf8");
  _cache = JSON.parse(raw);
  return _cache;
}

export function familyById(registry, familyId) {
  return registry.families.find((f) => f.id === familyId) || null;
}

export function allFamilyIds(registry) {
  return registry.families.map((f) => f.id);
}

export function updateRegistryTestStatus(registry, familyId, patch) {
  const family = familyById(registry, familyId);
  if (!family) return false;
  Object.assign(family, patch);
  return true;
}

export function writeFamilyRegistry(registry) {
  fs.writeFileSync(VCCK_REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
}
