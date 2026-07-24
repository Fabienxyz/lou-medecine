import fs from "node:fs";
import path from "node:path";
import { loadYamlFile } from "./anchors.js";

export function chapterPackagePath(chapterDir) {
  return path.join(chapterDir, "chapter.package.yaml");
}

export function projectionsManifestPath(chapterDir) {
  return path.join(chapterDir, "projections.yaml");
}

export function loadChapterPackage(chapterDir) {
  const filePath = chapterPackagePath(chapterDir);
  if (!fs.existsSync(filePath)) {
    return {
      ok: false,
      errors: [`missing chapter package config: ${filePath}`],
      config: null,
    };
  }
  const config = loadYamlFile(filePath);
  const errors = [];
  if (!config.slug) errors.push("chapter.package.yaml: missing slug");
  if (!config.title) errors.push("chapter.package.yaml: missing title");
  if (!config.mode) config.mode = "slice";
  return { ok: errors.length === 0, errors, config, filePath };
}

export function loadProjectionsManifest(chapterDir) {
  const filePath = projectionsManifestPath(chapterDir);
  if (!fs.existsSync(filePath)) {
    return {
      ok: false,
      errors: [`missing projections manifest: ${filePath}`],
      projections: [],
    };
  }
  const doc = loadYamlFile(filePath);
  const projections = doc?.projections;
  if (!Array.isArray(projections) || projections.length === 0) {
    return {
      ok: false,
      errors: ["projections.yaml: projections must be a non-empty array"],
      projections: [],
    };
  }
  const errors = [];
  for (const p of projections) {
    if (!p.id) errors.push("projection entry missing id");
    if (!p.path) errors.push(`projection ${p.id || "?"}: missing path`);
    if (!p.type) errors.push(`projection ${p.id || "?"}: missing type`);
    if (p.order == null) errors.push(`projection ${p.id || "?"}: missing order`);
  }
  return {
    ok: errors.length === 0,
    errors,
    projections: projections.sort((a, b) => a.order - b.order),
    filePath,
  };
}

export function resolveProjectionAbsPath(chapterDir, relPath) {
  return path.join(chapterDir, relPath);
}

export function bootstrapSemanticAllowlist(packageConfig) {
  const ids = packageConfig?.semantic_grounding_bootstrap?.allowed_claim_ids;
  return new Set(Array.isArray(ids) ? ids : []);
}

export function bootstrapSemanticVerdicts(packageConfig) {
  return packageConfig?.semantic_grounding_bootstrap?.verdicts || {};
}
