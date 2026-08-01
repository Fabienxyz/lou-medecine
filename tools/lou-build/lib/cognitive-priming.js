import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

/** @see learner-cognitive-priming-ap-b-technical-design.md §1.3 */
export const COGNITIVE_PRIMING_SCHEMA_VERSION = 1;
export const COGNITIVE_PRIMING_ARTIFACT_REL = "build/cognitive-priming.v1.json";
export const COGNITIVE_PRIMING_SOURCE_REL = "build/cognitive-priming.source.yaml";
export const COGNITIVE_PRIMING_MANIFEST_FIELD = "cognitive_priming_path";
export const AI_COMPLEMENT_BADGE_V1 =
  "Complément pédagogique (IA) — non issu du Collège";

export class CognitivePrimingError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "CognitivePrimingError";
    this.code = code;
  }
}

/**
 * @param {Record<string, unknown> | null | undefined} packageConfig
 * @param {{ evaluationConfig?: { completeness_level?: string } | null } | null | undefined} evaluation
 * @returns {boolean}
 */
export function isEditorialComplete(packageConfig, evaluation) {
  return (
    packageConfig?.editorial_completeness === "complete" ||
    evaluation?.evaluationConfig?.completeness_level === "complete"
  );
}

/**
 * @param {string} chapterDir
 * @returns {Record<string, unknown> | null}
 */
export function loadCognitivePrimingSource(chapterDir) {
  const sourcePath = path.join(chapterDir, COGNITIVE_PRIMING_SOURCE_REL);
  if (!fs.existsSync(sourcePath)) {
    return null;
  }
  const doc = YAML.parse(fs.readFileSync(sourcePath, "utf8"));
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new CognitivePrimingError(
      "CP-BUILD-VALIDATION",
      "cognitive priming source must be a YAML mapping"
    );
  }
  return doc;
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isProfileStar(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * AP-A §4.4 / V-CP-04 — inter_edn absent, null, or empty array only.
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidInterEdn(value) {
  return (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * @param {unknown} interEdn
 * @returns {string | null}
 */
function interEdnValidationError(interEdn) {
  if (isValidInterEdn(interEdn)) {
    return null;
  }
  if (Array.isArray(interEdn) && interEdn.length > 0) {
    return "CP-BUILD-INTER-EDN: prerequisites.inter_edn must be absent or empty";
  }
  return "CP-BUILD-INTER-EDN: prerequisites.inter_edn must be absent, null, or empty array";
}

/**
 * Deterministic JSON serialization for published artefacts and comparisons.
 * @param {Record<string, unknown>} record
 * @returns {string}
 */
export function serializeCognitivePrimingRecord(record) {
  return JSON.stringify(record, null, 2) + "\n";
}

/**
 * @param {string} chapterDir
 */
function removeStaleCognitivePrimingArtifact(chapterDir) {
  const artifactAbs = path.join(chapterDir, COGNITIVE_PRIMING_ARTIFACT_REL);
  if (fs.existsSync(artifactAbs)) {
    fs.unlinkSync(artifactAbs);
  }
}

/**
 * @param {Record<string, unknown>} source
 * @returns {string[]}
 */
export function validateCognitivePrimingSource(source) {
  const errors = [];

  if (source.schema_version !== COGNITIVE_PRIMING_SCHEMA_VERSION) {
    errors.push("V-CP-01: schema_version must be 1");
  }

  const profile = source.profile;
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    errors.push("V-CP-03: profile object required");
  } else {
    if (!isProfileStar(profile.comprehension)) {
      errors.push("V-CP-03: profile.comprehension must be integer 1–5");
    }
    if (!isProfileStar(profile.memorization)) {
      errors.push("V-CP-03: profile.memorization must be integer 1–5");
    }
  }

  const prerequisites = source.prerequisites;
  if (!prerequisites || typeof prerequisites !== "object" || Array.isArray(prerequisites)) {
    errors.push("prerequisites object required");
  } else {
    const interEdnError = interEdnValidationError(prerequisites.inter_edn);
    if (interEdnError) {
      errors.push(interEdnError);
    }

    const ednRefs = prerequisites.edn_references;
    if (!Array.isArray(ednRefs)) {
      errors.push("prerequisites.edn_references must be an array");
    } else {
      ednRefs.forEach(function (ref, index) {
        if (!ref || typeof ref !== "object" || Array.isArray(ref)) {
          errors.push(`V-CP-05: edn_references[${index}] must be an object`);
          return;
        }
        for (const key of ["reference_id", "chapter_id", "label"]) {
          if (!isNonEmptyString(ref[key])) {
            errors.push(`V-CP-05: edn_references[${index}].${key} required`);
          }
        }
        if ("item_label" in ref && ref.item_label != null && !isNonEmptyString(ref.item_label)) {
          errors.push(`V-CP-05: edn_references[${index}].item_label must be non-empty when present`);
        }
      });
    }

    const aiComplements = prerequisites.ai_complements;
    if (!Array.isArray(aiComplements)) {
      errors.push("prerequisites.ai_complements must be an array");
    } else {
      aiComplements.forEach(function (item, index) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          errors.push(`V-CP-06: ai_complements[${index}] must be an object`);
          return;
        }
        if (!isNonEmptyString(item.complement_id)) {
          errors.push(`V-CP-06: ai_complements[${index}].complement_id required`);
        }
        if (!isNonEmptyString(item.sentence)) {
          errors.push(`V-CP-06: ai_complements[${index}].sentence required`);
        }
        if ("badge" in item) {
          errors.push(
            `V-CP-06: ai_complements[${index}].badge must not appear in source YAML`
          );
        }
      });
    }
  }

  const summary = source.summary;
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    errors.push("summary object required");
  } else if (!Array.isArray(summary.bullets)) {
    errors.push("V-CP-07: summary.bullets must be an array");
  } else if (!summary.bullets.some((b) => isNonEmptyString(b))) {
    errors.push("V-CP-07: summary.bullets must contain at least one non-empty string");
  }

  if ("chapter_id" in source) {
    errors.push("chapter_id must not appear in source YAML (injected at build)");
  }

  return errors;
}

/**
 * @param {Record<string, unknown>} source
 * @param {{ chapter: string }} inventory
 * @returns {Record<string, unknown>}
 */
export function buildCognitivePrimingRecord(source, inventory) {
  const chapterId =
    typeof inventory?.chapter === "string" ? inventory.chapter.trim() : "";
  if (!chapterId) {
    throw new CognitivePrimingError(
      "CP-BUILD-VALIDATION",
      "inventory.chapter required to build cognitive priming record"
    );
  }

  const prerequisites = /** @type {Record<string, unknown>} */ (source.prerequisites);
  const aiRaw = Array.isArray(prerequisites.ai_complements)
    ? prerequisites.ai_complements
    : [];

  /** @type {Record<string, unknown>} */
  const record = {
    schema_version: COGNITIVE_PRIMING_SCHEMA_VERSION,
    chapter_id: chapterId,
    profile: {
      comprehension: source.profile?.comprehension,
      memorization: source.profile?.memorization,
    },
    prerequisites: {
      edn_references: Array.isArray(prerequisites.edn_references)
        ? prerequisites.edn_references.map(function (ref) {
            /** @type {Record<string, unknown>} */
            const out = {
              reference_id: ref.reference_id,
              chapter_id: ref.chapter_id,
              label: ref.label,
            };
            if (isNonEmptyString(ref.item_label)) {
              out.item_label = ref.item_label;
            }
            return out;
          })
        : [],
      ai_complements: aiRaw.map(function (item) {
        return {
          complement_id: item.complement_id,
          sentence: item.sentence,
          badge: AI_COMPLEMENT_BADGE_V1,
        };
      }),
    },
    summary: {
      bullets: Array.isArray(source.summary?.bullets)
        ? source.summary.bullets.filter((b) => isNonEmptyString(b))
        : [],
    },
  };

  const interEdn = prerequisites.inter_edn;
  if (Array.isArray(interEdn) && interEdn.length === 0) {
    record.prerequisites.inter_edn = [];
  }

  return record;
}

/**
 * @param {Record<string, unknown>} record
 * @param {string} manifestChapter
 * @returns {string[]}
 */
export function validateCognitivePrimingRecord(record, manifestChapter) {
  const errors = [];

  if (record.schema_version !== COGNITIVE_PRIMING_SCHEMA_VERSION) {
    errors.push("V-CP-01: schema_version must be 1");
  }

  if (record.chapter_id !== manifestChapter) {
    errors.push(
      `V-CP-02: chapter_id must match manifest chapter (${JSON.stringify(manifestChapter)})`
    );
  }

  const profile = record.profile;
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    errors.push("V-CP-03: profile object required");
  } else {
    if (!isProfileStar(profile.comprehension)) {
      errors.push("V-CP-03: profile.comprehension must be integer 1–5");
    }
    if (!isProfileStar(profile.memorization)) {
      errors.push("V-CP-03: profile.memorization must be integer 1–5");
    }
  }

  const prerequisites = record.prerequisites;
  if (!prerequisites || typeof prerequisites !== "object" || Array.isArray(prerequisites)) {
    errors.push("prerequisites object required");
  } else {
    const interEdnError = interEdnValidationError(prerequisites.inter_edn);
    if (interEdnError) {
      errors.push(interEdnError);
    }

    const ednRefs = prerequisites.edn_references;
    if (!Array.isArray(ednRefs)) {
      errors.push("prerequisites.edn_references must be an array");
    } else {
      ednRefs.forEach(function (ref, index) {
        if (!ref || typeof ref !== "object" || Array.isArray(ref)) {
          errors.push(`V-CP-05: edn_references[${index}] must be an object`);
          return;
        }
        for (const key of ["reference_id", "chapter_id", "label"]) {
          if (!isNonEmptyString(ref[key])) {
            errors.push(`V-CP-05: edn_references[${index}].${key} required`);
          }
        }
      });
    }

    const aiComplements = prerequisites.ai_complements;
    if (!Array.isArray(aiComplements)) {
      errors.push("prerequisites.ai_complements must be an array");
    } else {
      aiComplements.forEach(function (item, index) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          errors.push(`V-CP-06: ai_complements[${index}] must be an object`);
          return;
        }
        if (!isNonEmptyString(item.complement_id)) {
          errors.push(`V-CP-06: ai_complements[${index}].complement_id required`);
        }
        if (!isNonEmptyString(item.sentence)) {
          errors.push(`V-CP-06: ai_complements[${index}].sentence required`);
        }
        if (item.badge !== AI_COMPLEMENT_BADGE_V1) {
          errors.push(`V-CP-06: ai_complements[${index}].badge must be exact AP-B value`);
        }
      });
    }
  }

  const summary = record.summary;
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    errors.push("summary object required");
  } else if (!Array.isArray(summary.bullets)) {
    errors.push("V-CP-07: summary.bullets must be an array");
  } else if (!summary.bullets.some((b) => isNonEmptyString(b))) {
    errors.push("V-CP-07: summary.bullets must contain at least one non-empty string");
  }

  return errors;
}

/**
 * @param {string} chapterDir
 * @param {{ chapter: string }} inventory
 * @param {Record<string, unknown> | null | undefined} packageConfig
 * @param {{ evaluationConfig?: { completeness_level?: string } | null } | null | undefined} evaluation
 * @returns {string | null}
 */
export function publishCognitivePriming(chapterDir, inventory, packageConfig, evaluation) {
  const complete = isEditorialComplete(packageConfig, evaluation);
  const sourcePath = path.join(chapterDir, COGNITIVE_PRIMING_SOURCE_REL);

  if (!fs.existsSync(sourcePath)) {
    if (complete) {
      throw new CognitivePrimingError(
        "CP-BUILD-SOURCE-MISSING",
        `complete Release requires ${COGNITIVE_PRIMING_SOURCE_REL}`
      );
    }
    removeStaleCognitivePrimingArtifact(chapterDir);
    return null;
  }

  const source = loadCognitivePrimingSource(chapterDir);
  const sourceErrors = validateCognitivePrimingSource(source);
  if (sourceErrors.length) {
    throw new CognitivePrimingError(
      "CP-BUILD-VALIDATION",
      sourceErrors.join("; ")
    );
  }

  const record = buildCognitivePrimingRecord(source, inventory);
  const recordErrors = validateCognitivePrimingRecord(record, inventory.chapter);
  if (recordErrors.length) {
    throw new CognitivePrimingError(
      "CP-BUILD-VALIDATION",
      recordErrors.join("; ")
    );
  }

  const artifactAbs = path.join(chapterDir, COGNITIVE_PRIMING_ARTIFACT_REL);
  fs.mkdirSync(path.dirname(artifactAbs), { recursive: true });
  fs.writeFileSync(artifactAbs, serializeCognitivePrimingRecord(record));

  if (!fs.existsSync(artifactAbs)) {
    throw new CognitivePrimingError(
      "CP-BUILD-ARTIFACT-MISSING",
      `failed to write ${COGNITIVE_PRIMING_ARTIFACT_REL}`
    );
  }

  return COGNITIVE_PRIMING_ARTIFACT_REL;
}

/**
 * Stage I gate — complete packages require valid source; validate mode also checks published artefact.
 *
 * @param {{
 *   chapterDir: string;
 *   packageConfig: Record<string, unknown> | null | undefined;
 *   evaluation: { evaluationConfig?: { completeness_level?: string } | null } | null | undefined;
 *   inventory: { chapter: string };
 *   manifestPath: string;
 *   mutate: boolean;
 * }} opts
 * @returns {string[]}
 */
export function validateCognitivePrimingGate(opts) {
  const { chapterDir, packageConfig, evaluation, inventory, manifestPath, mutate } =
    opts;

  if (!isEditorialComplete(packageConfig, evaluation)) {
    return [];
  }

  const errors = [];
  const sourcePath = path.join(chapterDir, COGNITIVE_PRIMING_SOURCE_REL);
  if (!fs.existsSync(sourcePath)) {
    errors.push(
      `CP-BUILD-SOURCE-MISSING: complete Release requires ${COGNITIVE_PRIMING_SOURCE_REL}`
    );
    return errors;
  }

  try {
    const source = loadCognitivePrimingSource(chapterDir);
    errors.push(...validateCognitivePrimingSource(source));
    /** @type {Record<string, unknown> | undefined} */
    let expectedRecord;
    if (errors.length === 0) {
      expectedRecord = buildCognitivePrimingRecord(source, inventory);
      errors.push(...validateCognitivePrimingRecord(expectedRecord, inventory.chapter));
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    errors.push(`cognitive priming: ${message}`);
    return errors;
  }

  if (errors.length > 0) {
    return errors;
  }

  const source = loadCognitivePrimingSource(chapterDir);
  const expectedRecord = buildCognitivePrimingRecord(source, inventory);

  if (!mutate) {
    const artifactPath = path.join(chapterDir, COGNITIVE_PRIMING_ARTIFACT_REL);
    if (!fs.existsSync(artifactPath)) {
      errors.push(
        `CP-BUILD-ARTIFACT-MISSING: complete Release requires ${COGNITIVE_PRIMING_ARTIFACT_REL}`
      );
      return errors;
    }

    const expectedText = serializeCognitivePrimingRecord(expectedRecord);
    let publishedText;
    try {
      publishedText = fs.readFileSync(artifactPath, "utf8");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`V-CP-09: cognitive priming JSON not readable (${message})`);
      return errors;
    }

    if (publishedText !== expectedText) {
      errors.push(
        "CP-BUILD-SOURCE-ARTIFACT-DIVERGENCE: published JSON does not match source YAML"
      );
      return errors;
    }

    try {
      const record = JSON.parse(publishedText);
      errors.push(...validateCognitivePrimingRecord(record, inventory.chapter));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`V-CP-09: cognitive priming JSON not parseable (${message})`);
      return errors;
    }

    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        const declared = manifest[COGNITIVE_PRIMING_MANIFEST_FIELD];
        if (declared !== COGNITIVE_PRIMING_ARTIFACT_REL) {
          errors.push(
            `V-CP-08: manifest must declare ${COGNITIVE_PRIMING_MANIFEST_FIELD}=${COGNITIVE_PRIMING_ARTIFACT_REL}`
          );
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push(`V-CP-08: manifest unreadable (${message})`);
      }
    } else {
      errors.push("V-CP-08: manifest.json missing for complete Release validation");
    }
  }

  return errors;
}
