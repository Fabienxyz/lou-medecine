/**
 * W1 artifact snapshot verification — shared by gates, verify script, and tests.
 * Hash = SHA-256 of serialized artifact bytes (same path as update/verify scripts).
 */

import fs from "node:fs";
import path from "node:path";
import { loadVisualSpec } from "../visual-spec.js";
import { renderVcckSpec, determinismHash } from "./render-bridge.js";
import { loadVcckInventory } from "./inventory.js";
import { VCCK_POSITIVE, VCCK_SNAPSHOTS } from "./paths.js";
import {
  W1_APPROVED_POSITIVES,
  w1ApprovedFixturePaths,
  w1ApprovedMetadataByFile,
} from "./w1-snapshots.js";
import { W1_FAMILIES } from "./w1-constants.js";

export const SNAPSHOT_GATE = Object.freeze({
  PASS: "PASS",
  FAIL: "FAIL",
  BLOCKED: "BLOCKED",
});

const DEFAULT_SNAPSHOT = path.join(VCCK_SNAPSHOTS, "render-hashes.json");

function loadSnapshotFile(snapshotPath) {
  if (!fs.existsSync(snapshotPath)) {
    return { entries: {}, path: snapshotPath, exists: false };
  }
  const entries = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  return { entries, path: snapshotPath, exists: true };
}

/** Render fixture via W1-capable pipeline and return canonical artifact hash. */
export function computeFixtureArtifactHash(fixturePath, options = {}) {
  const inventory = options.inventory || loadVcckInventory();
  let spec;
  try {
    spec = loadVisualSpec(fixturePath);
  } catch (e) {
    return { ok: false, blocked: true, error: String(e.message || e) };
  }

  let rendered;
  try {
    rendered = renderVcckSpec(spec, { inventory });
  } catch (e) {
    return { ok: false, blocked: true, error: String(e.message || e) };
  }

  if (!rendered.ok || rendered.artifact == null) {
    return {
      ok: false,
      blocked: true,
      error: (rendered.errors || ["render not executable"]).join("; "),
    };
  }

  const artifact =
    typeof rendered.artifact === "string"
      ? rendered.artifact
      : Buffer.from(rendered.artifact);

  return {
    ok: true,
    blocked: false,
    hash: determinismHash(artifact),
    kind: rendered.kind,
  };
}

function compareMetadata(expectedEntry, approvedMeta, key) {
  const errors = [];
  if (!approvedMeta) {
    errors.push(`no approved metadata for ${key}`);
    return errors;
  }
  if (expectedEntry.family != null && expectedEntry.family !== approvedMeta.family) {
    errors.push(
      `family mismatch reference ${expectedEntry.family} vs approved ${approvedMeta.family}`,
    );
  }
  if (
    expectedEntry.contractVersion != null &&
    expectedEntry.contractVersion !== approvedMeta.contractVersion
  ) {
    errors.push(
      `contractVersion mismatch reference ${expectedEntry.contractVersion} vs approved ${approvedMeta.contractVersion}`,
    );
  }
  if (expectedEntry.technology != null && expectedEntry.technology !== approvedMeta.technology) {
    errors.push(
      `technology mismatch reference ${expectedEntry.technology} vs approved ${approvedMeta.technology}`,
    );
  }
  return errors;
}

/** Verify one fixture against snapshot reference entry. */
export function verifySingleArtifactSnapshot(fixturePath, options = {}) {
  const key = path.basename(fixturePath);
  const snapshotPath = options.snapshotPath || DEFAULT_SNAPSHOT;
  const snap = options.snapshot ?? loadSnapshotFile(snapshotPath);
  const metadataByFile = options.metadataByFile ?? w1ApprovedMetadataByFile();
  const approvedMeta = metadataByFile[key];
  const expectedEntry = snap.entries?.[key];

  if (!snap.exists) {
    return {
      fixture: key,
      fixturePath,
      status: SNAPSHOT_GATE.BLOCKED,
      errors: [`snapshot missing: ${snapshotPath}`],
    };
  }
  if (!expectedEntry) {
    return {
      fixture: key,
      fixturePath,
      status: SNAPSHOT_GATE.BLOCKED,
      errors: [`no snapshot entry for ${key}`],
    };
  }
  if (!approvedMeta) {
    return {
      fixture: key,
      fixturePath,
      status: SNAPSHOT_GATE.BLOCKED,
      errors: [`no approved metadata for ${key}`],
    };
  }

  const metaErrors = compareMetadata(expectedEntry, approvedMeta, key);
  if (metaErrors.length) {
    return {
      fixture: key,
      fixturePath,
      status: SNAPSHOT_GATE.FAIL,
      expectedHash: expectedEntry.hash,
      errors: metaErrors,
    };
  }

  const computed = computeFixtureArtifactHash(fixturePath, options);
  if (!computed.ok) {
    return {
      fixture: key,
      fixturePath,
      status: SNAPSHOT_GATE.BLOCKED,
      errors: [computed.error],
    };
  }

  const errors = [];
  if (computed.hash !== expectedEntry.hash) {
    errors.push(`hash mismatch expected ${expectedEntry.hash} got ${computed.hash}`);
  }
  if (approvedMeta.family && expectedEntry.family !== approvedMeta.family) {
    errors.push(
      `snapshot family ${expectedEntry.family} !== approved ${approvedMeta.family}`,
    );
  }
  if (
    approvedMeta.contractVersion &&
    expectedEntry.contractVersion !== approvedMeta.contractVersion
  ) {
    errors.push(
      `snapshot contractVersion ${expectedEntry.contractVersion} !== approved ${approvedMeta.contractVersion}`,
    );
  }
  if (approvedMeta.technology && expectedEntry.technology !== approvedMeta.technology) {
    errors.push(
      `snapshot technology ${expectedEntry.technology} !== approved ${approvedMeta.technology}`,
    );
  }

  const status =
    errors.length === 0 ? SNAPSHOT_GATE.PASS : SNAPSHOT_GATE.FAIL;

  return {
    fixture: key,
    fixturePath,
    status,
    hash: computed.hash,
    expectedHash: expectedEntry.hash,
    family: approvedMeta.family,
    contractVersion: approvedMeta.contractVersion,
    technology: approvedMeta.technology,
    ok: status === SNAPSHOT_GATE.PASS,
    errors,
  };
}

/** Verify W1 artifact snapshots — optional family filter. */
export function verifyW1ArtifactSnapshots(options = {}) {
  const snapshotPath = options.snapshotPath || DEFAULT_SNAPSHOT;
  const familyFilter = options.families ?? null;
  const metadataByFile = options.metadataByFile ?? w1ApprovedMetadataByFile();
  const snap = options.snapshot ?? loadSnapshotFile(snapshotPath);

  const entries = W1_APPROVED_POSITIVES.filter(
    (e) => !familyFilter || familyFilter.includes(e.family),
  );

  const results = entries.map((entry) =>
    verifySingleArtifactSnapshot(path.join(VCCK_POSITIVE, entry.file), {
      ...options,
      snapshotPath,
      snapshot: snap,
      metadataByFile,
    }),
  );

  const errors = results.flatMap((r) => r.errors.map((e) => `${r.fixture}: ${e}`));
  const blocked = results.some((r) => r.status === SNAPSHOT_GATE.BLOCKED);
  const ok = results.length > 0 && results.every((r) => r.status === SNAPSHOT_GATE.PASS);

  return {
    ok,
    blocked,
    results,
    errors,
    snapshotPath,
    count: results.length,
  };
}

/** Map family-level snapshot gate status from per-fixture results. */
export function snapshotGateStatusForFamily(familyId, options = {}) {
  const verification = verifyW1ArtifactSnapshots({
    ...options,
    families: [familyId],
  });
  if (verification.results.length === 0) return SNAPSHOT_GATE.BLOCKED;
  if (verification.blocked) return SNAPSHOT_GATE.BLOCKED;
  if (verification.ok) return SNAPSHOT_GATE.PASS;
  return SNAPSHOT_GATE.FAIL;
}

/** All eight approved fixture paths — same order as verify script. */
export function w1SnapshotFixturePaths() {
  return w1ApprovedFixturePaths();
}

/** Verify all eight — drop-in for vcck-verify-snapshots.mjs. */
export function verifyAllW1ArtifactSnapshots(options = {}) {
  return verifyW1ArtifactSnapshots({
    ...options,
    families: [...W1_FAMILIES],
  });
}
