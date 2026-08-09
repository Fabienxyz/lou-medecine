/**
 * Capability Coverage — declared consumes vs materialization in reference artifact.
 */

import fs from "node:fs";
import path from "node:path";
import { loadVisualSpec } from "../visual-spec.js";
import { loadFamilyRegistry } from "./registry.js";
import { runW1Pipeline } from "./w1-pipeline.js";
import { VCCK_POSITIVE, VCCK_REPORTS } from "./paths.js";
import { W1_FAMILIES } from "./w1-constants.js";
import { QUALIFICATION_STATUS } from "./w1-qualification.js";
import { extractAllConsumptionEntries } from "./consumption-paths.js";

export function decodeXmlText(value) {
  return String(value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function normalizeForMatch(value) {
  return decodeXmlText(value).replace(/\s+/g, " ").trim();
}

export function artifactContainsText(artifact, text) {
  const needle = normalizeForMatch(text);
  if (!needle) return true;
  const hay = normalizeForMatch(artifact.replace(/<[^>]+>/g, " "));
  return hay.includes(needle);
}

export function artifactContainsNodeKind(artifact, nodeId, kind) {
  const blockRe = new RegExp(
    `<g\\b[^>]*data-node-id="${escapeRegExp(nodeId)}"[^>]*>[\\s\\S]*?</g>`,
    "i",
  );
  const block = artifact.match(blockRe)?.[0];
  if (!block) return false;
  return new RegExp(`data-node-kind="${escapeRegExp(kind)}"`, "i").test(block);
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isEntryMaterialized(entry, artifact) {
  if (!artifact) return false;
  if (entry.type === "node-kind") {
    return artifactContainsNodeKind(artifact, entry.nodeId, entry.value);
  }
  return artifactContainsText(artifact, entry.value);
}

/**
 * @param {object} spec
 * @param {string} artifact
 * @param {string[]} consumes
 */
export function computeCoverageForSpec(spec, artifact, consumes = []) {
  const declaredPaths = [...consumes];
  const entries = extractAllConsumptionEntries(spec, declaredPaths);
  const materialized = [];
  const missing = [];

  for (const entry of entries) {
    if (isEntryMaterialized(entry, artifact)) materialized.push(entry);
    else missing.push(entry);
  }

  const declaredCount = entries.length;
  const materializedCount = materialized.length;
  const coveragePct = declaredCount === 0 ? 100 : Math.round((materializedCount / declaredCount) * 10000) / 100;

  return {
    declaredPaths,
    declaredCount,
    materializedCount,
    coveragePct,
    materialized,
    missing,
    ok: missing.length === 0 && declaredCount > 0,
  };
}

export function referenceFixturePath(familyId) {
  return path.join(VCCK_POSITIVE, `${familyId}-short.yaml`);
}

export function renderReferenceArtifact(familyId, spec) {
  const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
  if (!pipeline.ok || !pipeline.artifact) {
    return {
      ok: false,
      errors: pipeline.errors || [`pipeline failed at ${pipeline.stage}`],
      artifact: null,
    };
  }
  return { ok: true, errors: [], artifact: pipeline.artifact, kind: pipeline.kind };
}

export function computeFamilyCoverage(family, options = {}) {
  const familyId = family.id;
  const consumes = Array.isArray(family.consumes) ? family.consumes : [];
  const fixturePath = options.fixturePath || referenceFixturePath(familyId);

  if (!fs.existsSync(fixturePath)) {
    return {
      familyId,
      qualificationStatus: family.qualification_status,
      fixture: path.basename(fixturePath),
      ok: false,
      error: `missing fixture ${fixturePath}`,
      declaredPaths: consumes,
      declaredCount: 0,
      materializedCount: 0,
      coveragePct: 0,
      missing: [],
    };
  }

  if (consumes.length === 0) {
    return {
      familyId,
      qualificationStatus: family.qualification_status,
      fixture: path.basename(fixturePath),
      ok: false,
      error: "consumes declaration missing or empty",
      declaredPaths: [],
      declaredCount: 0,
      materializedCount: 0,
      coveragePct: 0,
      missing: [],
    };
  }

  let spec;
  try {
    spec = options.spec || loadVisualSpec(fixturePath);
  } catch (e) {
    return {
      familyId,
      qualificationStatus: family.qualification_status,
      fixture: path.basename(fixturePath),
      ok: false,
      error: String(e.message || e),
      declaredPaths: consumes,
      declaredCount: 0,
      materializedCount: 0,
      coveragePct: 0,
      missing: [],
    };
  }

  let artifact = options.artifact;
  if (artifact == null) {
    const rendered = renderReferenceArtifact(familyId, spec);
    if (!rendered.ok) {
      return {
        familyId,
        qualificationStatus: family.qualification_status,
        fixture: path.basename(fixturePath),
        ok: false,
        error: rendered.errors.join("; "),
        declaredPaths: consumes,
        declaredCount: 0,
        materializedCount: 0,
        coveragePct: 0,
        missing: [],
      };
    }
    artifact = rendered.artifact;
  }

  const coverage = computeCoverageForSpec(spec, artifact, consumes);
  return {
    familyId,
    qualificationStatus: family.qualification_status,
    fixture: path.basename(fixturePath),
    ok: coverage.ok,
    error: null,
    declaredPaths: coverage.declaredPaths,
    declaredCount: coverage.declaredCount,
    materializedCount: coverage.materializedCount,
    coveragePct: coverage.coveragePct,
    missing: coverage.missing.map((m) => ({
      path: m.path,
      value: m.value,
      type: m.type,
    })),
    materialized: coverage.materialized.map((m) => ({
      path: m.path,
      value: m.value,
      type: m.type,
    })),
  };
}

export function computeQualifiedCoverageReport(registry = loadFamilyRegistry()) {
  const families = registry.families.filter(
    (f) => f.qualification_status === QUALIFICATION_STATUS.QUALIFIED,
  );
  const results = families.map((f) => computeFamilyCoverage(f));
  const totalDeclared = results.reduce((s, r) => s + r.declaredCount, 0);
  const totalMaterialized = results.reduce((s, r) => s + r.materializedCount, 0);
  const overallPct =
    totalDeclared === 0 ? 100 : Math.round((totalMaterialized / totalDeclared) * 10000) / 100;

  return {
    generatedAt: new Date().toISOString(),
    qualifiedCount: families.length,
    overallDeclaredCount: totalDeclared,
    overallMaterializedCount: totalMaterialized,
    overallCoveragePct: overallPct,
    ok: results.every((r) => r.ok),
    families: results,
  };
}

export function formatCoverageReportMarkdown(report) {
  const lines = [];
  lines.push("# VCCK — Capability Coverage Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---|");
  lines.push(`| QUALIFIED families | ${report.qualifiedCount} |`);
  lines.push(`| Overall declared fields | ${report.overallDeclaredCount} |`);
  lines.push(`| Overall materialized fields | ${report.overallMaterializedCount} |`);
  lines.push(`| Overall coverage | ${report.overallCoveragePct}% |`);
  lines.push(`| All families PASS | ${report.ok ? "yes" : "no"} |`);
  lines.push("");

  for (const f of report.families) {
    lines.push(`## ${f.familyId}`);
    lines.push("");
    lines.push(`- **Status:** ${f.qualificationStatus}`);
    lines.push(`- **Reference fixture:** \`${f.fixture}\``);
    lines.push(`- **Declared (\`consumes\`):** ${f.declaredPaths?.join(", ") || "—"}`);
    lines.push(`- **Coverage:** ${f.coveragePct}% (${f.materializedCount}/${f.declaredCount})`);
    if (f.error) lines.push(`- **Error:** ${f.error}`);
    lines.push("");

    if (f.materialized?.length) {
      lines.push("**Materialized:**");
      for (const m of f.materialized) {
        lines.push(`- \`${m.path}\` — ${m.value}`);
      }
      lines.push("");
    }

    if (f.missing?.length) {
      lines.push("**Missing:**");
      for (const m of f.missing) {
        lines.push(`- \`${m.path}\` — ${m.value}`);
      }
      lines.push("");
    } else if (!f.error && f.declaredCount > 0) {
      lines.push("**Missing:** none");
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

export function writeCapabilityCoverageReport(options = {}) {
  const registry = options.registry || loadFamilyRegistry();
  const report = computeQualifiedCoverageReport(registry);
  const jsonPath = path.join(VCCK_REPORTS, "capability-coverage-report.json");
  const mdPath = path.join(VCCK_REPORTS, "capability-coverage-report.md");

  if (!options.dryRun) {
    fs.mkdirSync(VCCK_REPORTS, { recursive: true });
    fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(mdPath, formatCoverageReportMarkdown(report));
  }

  return { report, jsonPath, mdPath };
}

/** W1 qualified set — coverage runs on reference short fixtures. */
export function listCoverageTargetFamilies(registry = loadFamilyRegistry()) {
  return registry.families.filter(
    (f) =>
      f.qualification_status === QUALIFICATION_STATUS.QUALIFIED &&
      W1_FAMILIES.includes(f.id),
  );
}
