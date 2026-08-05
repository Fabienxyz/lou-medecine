/**
 * Authoritative W1 negative fixture matrix — per family, never global search.
 */

import path from "node:path";
import { VCCK_NEGATIVE } from "./paths.js";
import { W1_FAMILIES } from "./w1-constants.js";
import { loadFamilyRegistry } from "./registry.js";

export function w1NegativeMatrixForFamily(familyId) {
  const registry = loadFamilyRegistry();
  const family = registry.families.find((f) => f.id === familyId);
  if (!family || !W1_FAMILIES.includes(familyId)) return [];
  return (family.negative_fixtures || []).map((entry) => {
    const file = typeof entry === "string" ? entry : entry.path;
    const expectedCode =
      typeof entry === "object" && entry.expected_code
        ? entry.expected_code
        : family.expected_negative_code;
    return {
      familyId,
      path: file,
      loadPath: path.join(VCCK_NEGATIVE, file),
      expectedCode,
    };
  });
}

export function w1NegativeMatrixAll() {
  return W1_FAMILIES.flatMap((id) => w1NegativeMatrixForFamily(id));
}

export function validateW1FamilyNegatives(familyId, negativeResults) {
  const expected = w1NegativeMatrixForFamily(familyId);
  const errors = [];
  for (const exp of expected) {
    const found = negativeResults.find((n) => n.fixture === exp.path);
    if (!found) {
      errors.push(`${familyId}: missing negative fixture ${exp.path}`);
      continue;
    }
    if (found.negative !== "PASS") {
      errors.push(`${familyId}: ${exp.path} negative gate ${found.negative}`);
    }
    if (found.recognition !== "REJECTED" && found.recognition !== "N/A") {
      errors.push(`${familyId}: ${exp.path} expected REJECTED, got ${found.recognition}`);
    }
    if (found.code !== exp.expectedCode) {
      errors.push(
        `${familyId}: ${exp.path} expected code ${exp.expectedCode}, got ${found.code}`,
      );
    }
  }
  for (const n of negativeResults) {
    const belongs = expected.some((e) => e.path === n.fixture);
    if (!belongs) {
      errors.push(`${familyId}: unexpected negative fixture ${n.fixture}`);
    }
  }
  return { ok: errors.length === 0, errors, expected };
}
