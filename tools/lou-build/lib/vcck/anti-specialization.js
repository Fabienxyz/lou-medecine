/**
 * Transitive anti-specialization audit for VCCK entry points.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT } from "../paths.js";
import { VCCK_LIB_DIR, VCCK_ROOT } from "./paths.js";
import forbiddenPatternDefs from "../../vcck/forbidden-patterns.json" with { type: "json" };

const FORBIDDEN_IDENTIFIER_RES = /\b(validateMm2AgainstN09|normalizeDecisionTopology|CONDITION_ALIASES|visual-spec-v02-lotb-chapter)\b/;

const FORBIDDEN_FILENAME_RE =
  /\b(234|N02|N09|N10|N11|N17|N22|MM-1|MM-2|MM-3|mm-pump|n09-diagnostic|lotb-chapter)\b/i;

/** VCCK industrial entry points — transitive closure must not reach chapter corpus. */
export const VCCK_ENTRY_POINTS = [
  path.join(VCCK_LIB_DIR, "pipeline.js"),
  path.join(VCCK_LIB_DIR, "signature-analyzer.js"),
  path.join(VCCK_LIB_DIR, "render-bridge.js"),
  path.join(VCCK_LIB_DIR, "budgets.js"),
  path.join(VCCK_LIB_DIR, "status.js"),
  path.join(VCCK_LIB_DIR, "surfaces.js"),
  path.join(VCCK_LIB_DIR, "svg-geom-independent.js"),
  path.join(VCCK_LIB_DIR, "registry.js"),
  path.join(VCCK_LIB_DIR, "w1-pipeline.js"),
  path.join(VCCK_LIB_DIR, "w1-validate-artifact.js"),
  path.join(VCCK_LIB_DIR, "w1-exclusivity.js"),
  path.join(VCCK_LIB_DIR, "w1-candidate-drift.js"),
  path.join(VCCK_LIB_DIR, "w1-snapshots.js"),
  path.join(VCCK_LIB_DIR, "w1-gates.js"),
  path.join(VCCK_LIB_DIR, "w1-verdict.js"),
  path.join(REPO_ROOT, "tools/lou-build/scripts/run-vcck.mjs"),
  path.join(REPO_ROOT, "tools/lou-build/scripts/vcck-w1-verify-candidates.mjs"),
];

function buildPatterns(defs) {
  return defs.map((d) => ({
    id: d.id,
    re: d.token.includes("/")
      ? new RegExp(d.token.replace(/\//g, "\\/"))
      : new RegExp(`\\b${d.token}\\b`),
  }));
}

export const FORBIDDEN_PATTERNS = buildPatterns(forbiddenPatternDefs);

function parseImports(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const imports = [];
  const re = /(?:import\s+[^'"]+from\s+|import\s*)['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    imports.push(m[1]);
  }
  return imports;
}

function resolveImport(fromFile, spec) {
  if (spec.startsWith("node:") || !spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.mjs`,
    path.join(base, "index.js"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

export function collectTransitiveClosure(entryPoints) {
  const visited = new Set();
  const queue = [...entryPoints.filter((p) => fs.existsSync(p))];

  while (queue.length) {
    const file = queue.shift();
    if (visited.has(file)) continue;
    visited.add(file);

    for (const spec of parseImports(file)) {
      const resolved = resolveImport(file, spec);
      if (resolved && !visited.has(resolved)) queue.push(resolved);
    }
  }
  return visited;
}

function scanFileContent(filePath, patterns) {
  const violations = [];
  const text = fs.readFileSync(filePath, "utf8");
  const rel = path.relative(REPO_ROOT, filePath);

  for (const pat of patterns) {
    if (pat.re.test(text)) {
      violations.push({ file: rel, pattern: pat.id, kind: "content" });
    }
  }
  if (FORBIDDEN_IDENTIFIER_RES.test(text)) {
    const id = text.match(FORBIDDEN_IDENTIFIER_RES)?.[0] || "forbidden-identifier";
    violations.push({ file: rel, pattern: id, kind: "identifier" });
  }
  if (FORBIDDEN_FILENAME_RE.test(path.basename(filePath))) {
    violations.push({ file: rel, pattern: "forbidden-filename", kind: "filename" });
  }
  if (rel.includes("chapters/cardio/234") || rel.includes(".local/product-review-library/phase1a-234")) {
    violations.push({ file: rel, pattern: "chapter-corpus-import", kind: "corpus" });
  }

  return violations;
}

export function auditAntiSpecializationTransitive(options = {}) {
  const patterns = options.patterns || FORBIDDEN_PATTERNS;
  const entryPoints = options.entryPoints || VCCK_ENTRY_POINTS;
  const closure = collectTransitiveClosure(entryPoints);
  const violations = [];

  for (const file of closure) {
    const rel = path.relative(REPO_ROOT, file);
    if (file.includes("forbidden-patterns.json")) continue;
    if (rel.endsWith("lib/vcck/anti-specialization.js")) continue;
    violations.push(...scanFileContent(file, patterns));
  }

  return {
    ok: violations.length === 0,
    violations,
    scannedFiles: [...closure].map((f) => path.relative(REPO_ROOT, f)).sort(),
    entryPoints: entryPoints.map((p) => path.relative(REPO_ROOT, p)),
  };
}

/** Inspect explicit file list with the same detection engine — for negative probes. */
export function auditAntiSpecializationFiles(files, options = {}) {
  const patterns = options.patterns || FORBIDDEN_PATTERNS;
  const violations = [];
  const scanned = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    scanned.push(path.relative(REPO_ROOT, file));
    violations.push(...scanFileContent(file, patterns));
  }
  return { ok: violations.length === 0, violations, scannedFiles: scanned };
}

/** Authoritative closure scan — alias for transitive audit. */
export function auditAntiSpecialization(options = {}) {
  return auditAntiSpecializationTransitive(options);
}
