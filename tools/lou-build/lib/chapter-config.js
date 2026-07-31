import fs from "node:fs";
import path from "node:path";
import { loadYamlFile } from "./anchors.js";
import {
  validateKnownAbsentNeutral,
  validateProjectionRegistryNeutral,
} from "./manifest-neutralization.js";

export function chapterPackagePath(chapterDir) {
  return path.join(chapterDir, "chapter.package.yaml");
}

export function projectionsManifestPath(chapterDir) {
  return path.join(chapterDir, "projections.yaml");
}

export function evaluationConfigPath(chapterDir, packageConfig) {
  const rel =
    packageConfig?.evaluation?.config ||
    packageConfig?.evaluation_config ||
    "evaluation.yaml";
  return path.join(chapterDir, rel);
}

export function questionsRegistryPath(chapterDir, packageConfig) {
  const rel =
    packageConfig?.evaluation?.questions_registry ||
    "questions/registry.yaml";
  return path.join(chapterDir, rel);
}

export function scenariosRegistryPath(chapterDir, packageConfig) {
  const rel =
    packageConfig?.evaluation?.scenarios_registry ||
    "scenarios/registry.yaml";
  return path.join(chapterDir, rel);
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
  errors.push(...validateKnownAbsentNeutral(config.known_absent));
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
  errors.push(...validateProjectionRegistryNeutral(projections));
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

/**
 * Load curated Questions / Scenarios registries when present.
 * Optional for comprehension-only packages; required paths come from chapter.package.yaml.
 * Does not validate pedagogical content — structural registry only (contrats 07/09/08).
 */
export function loadEvaluationRegistries(chapterDir, packageConfig) {
  const errors = [];
  const evalCfgPath = evaluationConfigPath(chapterDir, packageConfig);
  let evaluationConfig = null;
  if (fs.existsSync(evalCfgPath)) {
    evaluationConfig = loadYamlFile(evalCfgPath);
  }

  const qPath = questionsRegistryPath(chapterDir, packageConfig);
  const sPath = scenariosRegistryPath(chapterDir, packageConfig);
  const hasEvalDecl = Boolean(packageConfig?.evaluation);
  const questionsPathExists = fs.existsSync(qPath);
  const scenariosPathExists = fs.existsSync(sPath);

  if (hasEvalDecl && !questionsPathExists) {
    errors.push(`evaluation: missing questions registry: ${qPath}`);
  }
  if (hasEvalDecl && !scenariosPathExists) {
    errors.push(`evaluation: missing scenarios registry: ${sPath}`);
  }

  let questions = [];
  if (questionsPathExists) {
    const doc = loadYamlFile(qPath);
    questions = Array.isArray(doc?.questions) ? doc.questions : [];
    if (!Array.isArray(doc?.questions)) {
      errors.push("questions/registry.yaml: questions must be an array");
    }
    const seen = new Set();
    for (const q of questions) {
      if (!q?.question_id) errors.push("questions registry: entry missing question_id");
      else if (seen.has(q.question_id)) {
        errors.push(`questions registry: duplicate question_id ${q.question_id}`);
      } else seen.add(q.question_id);
      if (!q?.path) {
        errors.push(
          `questions registry: ${q?.question_id || "?"}: missing path`
        );
      }
      if (!q?.status) {
        errors.push(
          `questions registry: ${q?.question_id || "?"}: missing status`
        );
      }
      if (q?.path) {
        const abs = path.join(chapterDir, q.path);
        if (!fs.existsSync(abs)) {
          errors.push(
            `questions registry: ${q.question_id}: file missing (${q.path})`
          );
        }
      }
    }
  }

  let scenarios = [];
  if (scenariosPathExists) {
    const doc = loadYamlFile(sPath);
    scenarios = Array.isArray(doc?.scenarios) ? doc.scenarios : [];
    if (!Array.isArray(doc?.scenarios)) {
      errors.push("scenarios/registry.yaml: scenarios must be an array");
    }
    const seen = new Set();
    for (const s of scenarios) {
      if (!s?.scenario_id) errors.push("scenarios registry: entry missing scenario_id");
      else if (seen.has(s.scenario_id)) {
        errors.push(`scenarios registry: duplicate scenario_id ${s.scenario_id}`);
      } else seen.add(s.scenario_id);
      if (!s?.path) {
        errors.push(
          `scenarios registry: ${s?.scenario_id || "?"}: missing path`
        );
      }
      if (!s?.status) {
        errors.push(
          `scenarios registry: ${s?.scenario_id || "?"}: missing status`
        );
      }
      if (!s?.kind) {
        errors.push(
          `scenarios registry: ${s?.scenario_id || "?"}: missing kind`
        );
      }
      if (s?.path) {
        const abs = path.join(chapterDir, s.path);
        if (!fs.existsSync(abs)) {
          errors.push(
            `scenarios registry: ${s.scenario_id}: file missing (${s.path})`
          );
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    evaluationConfig,
    questions,
    scenarios,
    questionsRegistryPath: questionsPathExists ? qPath : null,
    scenariosRegistryPath: scenariosPathExists ? sPath : null,
  };
}

export function bootstrapSemanticAllowlist(packageConfig) {
  const ids = packageConfig?.semantic_grounding_bootstrap?.allowed_claim_ids;
  return new Set(Array.isArray(ids) ? ids : []);
}

export function bootstrapSemanticVerdicts(packageConfig) {
  return packageConfig?.semantic_grounding_bootstrap?.verdicts || {};
}
