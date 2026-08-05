/**
 * W1 registry qualification — persistent status vs operational readiness.
 */

import { W1_FAMILIES } from "./w1-constants.js";
import { loadFamilyRegistry, familyById } from "./registry.js";

export const QUALIFICATION_STATUS = Object.freeze({
  EXPERIMENTAL: "EXPERIMENTAL",
  QUALIFIED: "QUALIFIED",
  FROZEN: "FROZEN",
});

export const OPERATIONAL_STATUS = Object.freeze({
  READY_FOR_USE: "READY_FOR_USE",
  BLOCKED_FOR_USE: "BLOCKED_FOR_USE",
});

export const W1_QUALIFIED_FAMILY_IDS = Object.freeze([...W1_FAMILIES]);

export function getFamilyQualificationStatus(familyId, registry = loadFamilyRegistry()) {
  const family = familyById(registry, familyId);
  return family?.qualification_status ?? QUALIFICATION_STATUS.EXPERIMENTAL;
}

export function computeOperationalStatus(gates, requiredGates) {
  const failed = requiredGates.filter((g) => gates[g] !== "PASS");
  return failed.length === 0
    ? OPERATIONAL_STATUS.READY_FOR_USE
    : OPERATIONAL_STATUS.BLOCKED_FOR_USE;
}

export function summarizeRegistryQualification(registry = loadFamilyRegistry()) {
  const counts = { QUALIFIED: 0, EXPERIMENTAL: 0, FROZEN: 0, other: 0 };
  for (const f of registry.families) {
    const status = f.qualification_status;
    if (status in counts) counts[status]++;
    else counts.other++;
  }
  return counts;
}

export function assertRegistryQualificationContract(registry = loadFamilyRegistry()) {
  const errors = [];
  const summary = summarizeRegistryQualification(registry);

  if (summary.QUALIFIED !== 4) errors.push(`expected 4 QUALIFIED, got ${summary.QUALIFIED}`);
  if (summary.EXPERIMENTAL !== 14) errors.push(`expected 14 EXPERIMENTAL, got ${summary.EXPERIMENTAL}`);
  if (summary.FROZEN !== 0) errors.push(`expected 0 FROZEN, got ${summary.FROZEN}`);
  if (summary.other !== 0) errors.push(`unexpected qualification_status values: ${summary.other}`);

  for (const id of W1_QUALIFIED_FAMILY_IDS) {
    if (getFamilyQualificationStatus(id, registry) !== QUALIFICATION_STATUS.QUALIFIED) {
      errors.push(`${id} should be QUALIFIED`);
    }
  }

  const qualifiedSet = new Set(W1_QUALIFIED_FAMILY_IDS);
  for (const f of registry.families) {
    if (f.qualification_status === QUALIFICATION_STATUS.QUALIFIED && !qualifiedSet.has(f.id)) {
      errors.push(`${f.id} is QUALIFIED but not in audited W1 set`);
    }
  }

  return { ok: errors.length === 0, errors, summary };
}
