/**
 * Deterministic validation of independent full-chapter reconciliation v2.
 * Audit-only: allows missed/ambiguous. Does NOT overwrite Phase 3 FAIL artifacts
 * or the OAP slice reconciliation fixture.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadYamlFile } from "../../../../../tools/lou-build/lib/anchors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reconPath = path.join(__dirname, "reconciliation-full-v2.yaml");
const inventoryPath = path.resolve(__dirname, "../inventory.yaml");

const ALLOWED = new Set([
  "represented",
  "deferred",
  "excluded-with-justification",
  "missed",
  "ambiguous",
]);

const PRESERVED = ["KP-040", "KP-041", "KP-042"];

function fail(errors) {
  console.error("VALIDATION FAIL");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

function main() {
  const errors = [];
  if (!fs.existsSync(reconPath)) errors.push(`missing ${reconPath}`);
  if (!fs.existsSync(inventoryPath)) errors.push(`missing ${inventoryPath}`);
  if (errors.length) fail(errors);

  const recon = loadYamlFile(reconPath);
  const inv = loadYamlFile(inventoryPath);
  const invIds = new Set(inv.kps.map((k) => k.id));

  if (recon.chapter !== "cardio/234") errors.push("chapter mismatch");
  if (recon.edition !== "2024-SFC") errors.push("edition mismatch");
  if (recon.scope !== "full-chapter") errors.push("scope must be full-chapter");
  if (recon.methodology !== "independent-source-to-inventory-v2") {
    errors.push("methodology mismatch");
  }
  if (!["pass", "fail", "ambiguous"].includes(recon.status)) {
    errors.push(`invalid status ${recon.status}`);
  }
  if (recon.inventory_kp_count !== 109) {
    errors.push(`inventory_kp_count ${recon.inventory_kp_count} != 109`);
  }
  if (invIds.size !== 109) errors.push(`inventory has ${invIds.size} KPs, expected 109`);

  for (const id of PRESERVED) {
    if (!invIds.has(id)) errors.push(`missing preserved identity ${id}`);
  }

  const cand = [...invIds].filter((id) => String(id).startsWith("CAND"));
  if (cand.length) errors.push(`CAND IDs present: ${cand.join(",")}`);

  const segments = recon.segments || [];
  if (segments.length === 0) errors.push("segments empty");

  const seen = new Set();
  const counts = {
    represented: 0,
    deferred: 0,
    "excluded-with-justification": 0,
    missed: 0,
    ambiguous: 0,
  };
  const mapped = new Set();

  for (const seg of segments) {
    if (!seg.id) errors.push("segment missing id");
    else if (seen.has(seg.id)) errors.push(`duplicate segment id ${seg.id}`);
    else seen.add(seg.id);

    if (!seg.section_path) errors.push(`${seg.id}: missing section_path`);
    if (!seg.evidence) errors.push(`${seg.id}: missing evidence`);
    if (!ALLOWED.has(seg.disposition)) {
      errors.push(`${seg.id}: invalid disposition ${seg.disposition}`);
    } else {
      counts[seg.disposition]++;
    }

    if (
      (seg.disposition === "represented" || seg.disposition === "deferred") &&
      (!Array.isArray(seg.kp) || seg.kp.length === 0)
    ) {
      errors.push(`${seg.id}: ${seg.disposition} requires kp[]`);
    }
    if (seg.disposition === "missed" && !seg.note) {
      errors.push(`${seg.id}: missed requires note`);
    }
    if (seg.disposition === "ambiguous" && !seg.note) {
      errors.push(`${seg.id}: ambiguous requires note`);
    }
    if (
      seg.disposition === "excluded-with-justification" &&
      !seg.note &&
      !(seg.kp && seg.kp.length)
    ) {
      errors.push(`${seg.id}: exclusion requires note or kp justification row`);
    }

    for (const id of [...(seg.kp || []), ...(seg.related_kp || [])]) {
      if (!invIds.has(id)) errors.push(`${seg.id}: unknown KP ${id}`);
      if (seg.kp?.includes(id)) mapped.add(id);
    }
  }

  const summary = recon.summary || {};
  if (summary.total_segments !== segments.length) {
    errors.push(
      `summary.total_segments ${summary.total_segments} != segments.length ${segments.length}`
    );
  }
  for (const [disp, n] of Object.entries(counts)) {
    const key =
      disp === "excluded-with-justification"
        ? "excluded_with_justification"
        : disp;
    if (summary[key] !== n) {
      errors.push(`summary.${key} ${summary[key]} != counted ${n}`);
    }
  }

  if (counts.missed > 0 && recon.status === "pass") {
    errors.push("status pass incompatible with missed > 0");
  }
  if (counts.missed === 0 && counts.ambiguous > 0 && recon.status === "pass") {
    errors.push("status pass incompatible with unresolved ambiguous > 0");
  }
  if (counts.missed > 0 && recon.status !== "fail") {
    errors.push("status must be fail when missed > 0");
  }

  const orphans = [...invIds].filter((id) => !mapped.has(id));
  const reportedOrphans = recon.reverse_check?.orphan_kps || [];
  if (orphans.length !== reportedOrphans.length) {
    errors.push(
      `orphan count mismatch: computed ${orphans.length}, reported ${reportedOrphans.length}`
    );
  }
  for (const id of orphans) {
    if (!reportedOrphans.includes(id)) {
      errors.push(`orphan ${id} not listed in reverse_check.orphan_kps`);
    }
  }

  if (recon.slice || recon.slice_scope) {
    errors.push("full-chapter artifact must not carry OAP slice keys");
  }

  if (errors.length) fail(errors);

  console.log("VALIDATION PASS");
  console.log(
    JSON.stringify(
      {
        status: recon.status,
        total_segments: segments.length,
        counts,
        inventory_kp_count: invIds.size,
        mapped_kps: mapped.size,
        orphan_kps: orphans,
        preserved: Object.fromEntries(PRESERVED.map((id) => [id, invIds.has(id)])),
        cand_ids: cand,
      },
      null,
      2
    )
  );
}

main();
