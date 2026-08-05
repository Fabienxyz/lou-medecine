/**
 * W1 probative fixture set — gates must run on each variant per family.
 */

import path from "node:path";
import fs from "node:fs";
import { VCCK_POSITIVE, VCCK_W1 } from "./paths.js";
import { W1_FAMILIES } from "./w1-constants.js";

export const W1_PROBATIVE_VARIANTS = Object.freeze([
  "short",
  "long",
  "cardinal-90",
  "text-90",
  "stress-90",
]);

/** Resolve path for a probative W1 fixture variant. */
export function probativeFixturePath(familyId, variant) {
  const file = `${familyId}-${variant}.yaml`;
  if (variant === "short" || variant === "long") {
    return path.join(VCCK_POSITIVE, file);
  }
  return path.join(VCCK_W1, familyId, file);
}

export function listProbativeFixtures(familyId) {
  return W1_PROBATIVE_VARIANTS.map((variant) => ({
    familyId,
    variant,
    file: `${familyId}-${variant}.yaml`,
    path: probativeFixturePath(familyId, variant),
    exists: fs.existsSync(probativeFixturePath(familyId, variant)),
  }));
}

export function allProbativeFixturesExist() {
  const missing = [];
  for (const familyId of W1_FAMILIES) {
    for (const fx of listProbativeFixtures(familyId)) {
      if (!fx.exists) missing.push(`${familyId}:${fx.variant}`);
    }
  }
  return { ok: missing.length === 0, missing };
}
