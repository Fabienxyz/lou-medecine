import fs from "node:fs";
import path from "node:path";
import { validateManifestReaderNeutral } from "./manifest-neutralization.js";

/** In-package path for verbatim Collège source (Reader offline / ADR-006). */
export const PUBLISHED_COLLEGE_SOURCE_REL = "source/official-college.md";

/**
 * Copy FIL B source into the published package (contrat 04 §3).
 * @returns {string | null} manifest-relative path when published
 */
export function publishCollegeSource(chapterDir, sourceMeta) {
  const rel = sourceMeta?.source_file;
  if (typeof rel !== "string" || !rel.trim()) {
    return null;
  }
  const metaPath = sourceMeta._path;
  if (typeof metaPath !== "string") {
    return null;
  }
  const absSource = path.resolve(path.dirname(metaPath), rel);
  if (!fs.existsSync(absSource)) {
    throw new Error(`College source file not found: ${absSource}`);
  }
  const destDir = path.join(chapterDir, "source");
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(absSource, path.join(destDir, "official-college.md"));
  return PUBLISHED_COLLEGE_SOURCE_REL;
}

function collegeSourceManifestPath(chapterDir) {
  const published = path.join(chapterDir, PUBLISHED_COLLEGE_SOURCE_REL);
  return fs.existsSync(published) ? PUBLISHED_COLLEGE_SOURCE_REL : null;
}

function invalidatePublishableState(paths) {
  if (fs.existsSync(paths.manifest)) {
    fs.unlinkSync(paths.manifest);
  }
}

function assembleManifest({
  chapterDir,
  inventory,
  sourceMeta,
  packageConfig,
  projections,
  reconciliation,
  visualBuild,
  evaluation,
}) {
  const mode = packageConfig.mode || "slice";
  const manifest = {
    chapter: inventory.chapter,
    slug: packageConfig.slug,
    title: packageConfig.title,
    specialty: packageConfig.specialty,
    chapterLine: packageConfig.chapter_line || packageConfig.chapterLine,
    source_edition: sourceMeta.edition,
    trace_index: "build/traceability.json",
    known_absent: packageConfig.known_absent || [],
    projections: [],
    visuals: [],
  };

  if (packageConfig.editorial_completeness) {
    manifest.editorial_completeness = packageConfig.editorial_completeness;
  }

  if (chapterDir) {
    const collegeSourcePath = collegeSourceManifestPath(chapterDir);
    if (collegeSourcePath) {
      manifest.college_source_path = collegeSourcePath;
    }
  }

  if (mode === "slice") {
    if (inventory.slice) {
      manifest.slice = inventory.slice;
    }
    manifest.slice_reconciliation_invariant = "pass";
    manifest.slice_reconciliation_scope =
      reconciliation.scope ||
      reconciliation.result?.reconciliation_scope ||
      reconciliation.result?.slice_scope;
    manifest.slice_reconciliation_segments = reconciliation.requiredIds;
  } else {
    manifest.chapter_reconciliation_invariant = "pass";
    manifest.chapter_reconciliation_scope =
      reconciliation.scope ||
      reconciliation.result?.reconciliation_scope ||
      reconciliation.result?.slice_scope;
    manifest.chapter_reconciliation_segments = reconciliation.requiredIds;
  }

  const visualsByElement = new Map(
    (visualBuild.rendered || []).map((v) => [v.elementId, v])
  );

  for (const p of projections || []) {
    const entry = {
      id: p.id,
      type: p.type,
      family: p.family || "understanding",
      order: p.order,
      path: p.path,
      status: p.status || "published",
    };
    if (p.elements) entry.elements = p.elements;
    if (p.visual_elements) {
      entry.visuals = {};
      for (const elementId of p.visual_elements) {
        const vis = visualsByElement.get(elementId);
        if (vis) entry.visuals[elementId] = vis.relPath;
      }
    }
    manifest.projections.push(entry);
  }

  for (const vis of visualBuild.rendered || []) {
    manifest.visuals.push({
      id: String(vis.elementId).toLowerCase(),
      element: vis.elementId,
      path: vis.relPath,
      // Alt text is derived from the specification, never authored here (I1). The authored
      // `visual_alts` entry is itself spec-derived prose reviewed once; the fallback is the
      // element's own step labels.
      alt:
        packageConfig.visual_alts?.[vis.elementId] ||
        (vis.spec?.steps || []).map((s) => s.label).join(" → "),
    });
  }

  // Official Visual availability, in the three states the renderer must distinguish (C.6). An
  // element absent from this list warrants no visual: a correct outcome, not a gap.
  const availability = new Map();
  for (const vis of visualBuild.rendered || []) {
    availability.set(vis.elementId, { element: vis.elementId, state: "published" });
  }
  for (const p of visualBuild.planned || []) {
    if (!availability.has(p.elementId)) {
      availability.set(p.elementId, {
        element: p.elementId,
        state: "planned-not-built",
        intent: p.intent,
      });
    }
  }
  for (const w of visualBuild.withheld || []) {
    availability.set(w.elementId, {
      element: w.elementId,
      state: w.state,
      reasons: w.reasons,
    });
  }
  manifest.official_visuals = [...availability.values()];

  // Questions / Scenarios — first-class Release objects (contrat 04 §7.4, 07, 09).
  // Registry entries only; pedagogical payloads stay in curated YAML files.
  const questions = evaluation?.questions || [];
  const scenarios = evaluation?.scenarios || [];
  if (questions.length || scenarios.length || packageConfig.evaluation) {
    manifest.questions = questions.map((q) => ({
      question_id: q.question_id,
      path: q.path,
      status: q.status,
    }));
    manifest.scenarios = scenarios.map((s) => ({
      scenario_id: s.scenario_id,
      kind: s.kind,
      path: s.path,
      status: s.status,
    }));
    if (evaluation?.evaluationConfig?.completeness_level) {
      manifest.editorial_completeness =
        packageConfig.editorial_completeness ||
        evaluation.evaluationConfig.completeness_level;
    }
  }

  const neutralErrors = validateManifestReaderNeutral(manifest);
  if (neutralErrors.length) {
    throw new Error(
      "Reader-neutral manifest assembly failed:\n" + neutralErrors.join("\n")
    );
  }

  return manifest;
}

export { assembleManifest, invalidatePublishableState };
