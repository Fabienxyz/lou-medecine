/**
 * Reader Composition V1 — Composition Engine (Lot B).
 * compose(manifest, compositionSpec) → { readingViewModel, diagnostics }
 * No DOM, no fetch, no medical content.
 */

import { validateCompositionSpec, SPEC_VERSION } from "./composition-spec-schema.js";
import { validateReadingViewModel, assertNoMedicalContent } from "./reading-view-model.js";

/** @typedef {{ code: string, severity: 'error' | 'warn', message: string, context?: Record<string, unknown> }} CompositionDiagnostic */

/**
 * @param {string} code
 * @param {'error' | 'warn'} severity
 * @param {string} message
 * @param {Record<string, unknown>} [context]
 * @returns {CompositionDiagnostic}
 */
function diagnostic(code, severity, message, context) {
  return context ? { code, severity, message, context } : { code, severity, message };
}

/**
 * @param {Record<string, unknown>} manifest
 */
function buildChapterMeta(manifest) {
  /** @type {Record<string, unknown>} */
  const chapter = { id: manifest.chapter };
  if (manifest.title) chapter.title = manifest.title;
  if (manifest.specialty) chapter.specialty = manifest.specialty;
  if (manifest.source_edition !== undefined) chapter.edition = manifest.source_edition;
  if (manifest.slug) chapter.slug = manifest.slug;
  if (manifest.chapterLine) chapter.chapterLine = manifest.chapterLine;
  if (manifest.trace_index) chapter.traceIndexRef = manifest.trace_index;
  return chapter;
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {string} projectionId
 */
function lookupProjection(manifest, projectionId) {
  const projections = Array.isArray(manifest.projections) ? manifest.projections : [];
  return projections.find(function (p) {
    return p && p.id === projectionId;
  });
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {string} projectionId
 */
function isProjectionKnownAbsent(manifest, projectionId) {
  const absent = Array.isArray(manifest.known_absent) ? manifest.known_absent : [];
  return absent.includes(projectionId);
}

/**
 * @param {Record<string, unknown>} projection
 * @returns {boolean}
 */
function isProjectionPublished(projection) {
  return (
    projection &&
    projection.status === "published" &&
    typeof projection.path === "string" &&
    projection.path.length > 0
  );
}

/**
 * @param {Record<string, unknown>} projection
 * @param {string} projectionId
 * @returns {{ blocks: Array<Record<string, unknown>>, resolved: boolean }}
 */
function blocksFromProjection(projection, projectionId) {
  if (!isProjectionPublished(projection)) {
    return { blocks: [], resolved: false };
  }
  const elements = Array.isArray(projection.elements) ? projection.elements : [];
  const artifactRef = projection.path;
  const blocks = elements.map(function (elementId, index) {
    return {
      elementId,
      sourceProjectionId: projectionId,
      pedagogicalOrder: index + 1,
      artifactRef,
    };
  });
  return { blocks, resolved: true };
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {{ kind: string, ref?: string, mergeOrder?: number }} source
 * @param {CompositionDiagnostic[]} diagnostics
 * @param {string} viewId
 */
function resolveSource(manifest, source, diagnostics, viewId) {
  const kind = source.kind;

  if (kind === "none") {
    return { kind, resolved: true, blocks: [], questions: [], scenarios: [], collegeRef: null };
  }

  if (kind === "projection") {
    const projectionId = source.ref;
    const projection = lookupProjection(manifest, projectionId);

    if (!projection) {
      diagnostics.push(
        diagnostic(
          "identity-referenced-but-absent",
          "error",
          `Projection "${projectionId}" referenced by view "${viewId}" is absent from manifest`,
          { viewId, projectionId }
        )
      );
      return { kind, resolved: false, blocks: [], questions: [], scenarios: [], collegeRef: null };
    }

    if (isProjectionKnownAbsent(manifest, projectionId)) {
      return { kind, resolved: false, blocks: [], questions: [], scenarios: [], collegeRef: null };
    }

    const { blocks, resolved } = blocksFromProjection(projection, projectionId);
    if (!resolved) {
      diagnostics.push(
        diagnostic(
          "identity-referenced-but-absent",
          "error",
          `Projection "${projectionId}" is not published with a usable path`,
          { viewId, projectionId, status: projection.status }
        )
      );
    }
    return { kind, resolved, blocks, questions: [], scenarios: [], collegeRef: null, mergeOrder: source.mergeOrder };
  }

  if (kind === "questions") {
    if (source.ref !== "registry") {
      diagnostics.push(
        diagnostic(
          "identity-referenced-but-absent",
          "error",
          `Questions source ref must be "registry" (got "${source.ref}")`,
          { viewId, ref: source.ref }
        )
      );
      return { kind, resolved: false, blocks: [], questions: [], scenarios: [], collegeRef: null };
    }
    const questions = (Array.isArray(manifest.questions) ? manifest.questions : [])
      .filter(function (q) {
        return q && q.status === "published" && typeof q.path === "string";
      })
      .map(function (q) {
        return {
          questionId: q.question_id,
          path: q.path,
          status: q.status,
        };
      });
    return {
      kind,
      resolved: questions.length > 0,
      blocks: [],
      questions,
      scenarios: [],
      collegeRef: null,
    };
  }

  if (kind === "scenarios") {
    if (source.ref !== "registry") {
      diagnostics.push(
        diagnostic(
          "identity-referenced-but-absent",
          "error",
          `Scenarios source ref must be "registry" (got "${source.ref}")`,
          { viewId, ref: source.ref }
        )
      );
      return { kind, resolved: false, blocks: [], questions: [], scenarios: [], collegeRef: null };
    }
    const scenarios = (Array.isArray(manifest.scenarios) ? manifest.scenarios : [])
      .filter(function (s) {
        return s && s.status === "published" && typeof s.path === "string";
      })
      .map(function (s) {
        return {
          scenarioId: s.scenario_id,
          kind: s.kind,
          path: s.path,
          status: s.status,
        };
      });
    return {
      kind,
      resolved: scenarios.length > 0,
      blocks: [],
      questions: [],
      scenarios,
      collegeRef: null,
    };
  }

  if (kind === "college-source") {
    const ref = source.ref;
    const manifestValue = ref ? manifest[ref] : undefined;
    const collegePath =
      typeof manifest.college_source_path === "string"
        ? manifest.college_source_path
        : typeof manifest.collegeSourcePath === "string"
          ? manifest.collegeSourcePath
          : null;

    if (manifestValue === undefined && !collegePath) {
      diagnostics.push(
        diagnostic(
          "identity-referenced-but-absent",
          "error",
          `College source ref "${ref}" is absent from manifest`,
          { viewId, ref }
        )
      );
      return { kind, resolved: false, blocks: [], questions: [], scenarios: [], collegeRef: null };
    }

    /** @type {Record<string, unknown>} */
    const collegeRef = { ref };
    if (manifestValue !== undefined) collegeRef.value = manifestValue;
    if (collegePath) collegeRef.path = collegePath;

    return {
      kind,
      resolved: Boolean(collegePath),
      blocks: [],
      questions: [],
      scenarios: [],
      collegeRef,
    };
  }

  return { kind, resolved: false, blocks: [], questions: [], scenarios: [], collegeRef: null };
}

/**
 * @param {string} policy
 * @param {boolean} anyResolved
 */
function availabilityFromPolicy(policy, anyResolved) {
  if (policy === "always-planned") {
    return "planned";
  }
  if (policy === "always-published-for-shell") {
    return "published";
  }
  return anyResolved ? "published" : "planned";
}

/**
 * @param {import('./composition-spec-schema.js').validateCompositionSpec extends (s: infer S) => unknown ? S : never} compositionSpec
 * @param {Record<string, unknown>} manifest
 * @returns {{ readingViewModel: Record<string, unknown>, diagnostics: CompositionDiagnostic[] }}
 */
export function compose(manifest, compositionSpec) {
  /** @type {CompositionDiagnostic[]} */
  const diagnostics = [];

  const specCheck = validateCompositionSpec(compositionSpec);
  if (!specCheck.ok) {
    return {
      readingViewModel: {
        chapter: buildChapterMeta(manifest || {}),
        views: [],
        diagnostics: [
          diagnostic(
            "incompatible-spec-version",
            "error",
            `Invalid composition spec: ${specCheck.errors.join("; ")}`
          ),
        ],
      },
      diagnostics: [
        diagnostic(
          "incompatible-spec-version",
          "error",
          `Invalid composition spec: ${specCheck.errors.join("; ")}`
        ),
      ],
    };
  }

  if (compositionSpec.version !== SPEC_VERSION) {
    const d = diagnostic(
      "incompatible-spec-version",
      "error",
      `Unsupported spec version "${compositionSpec.version}"`
    );
    return {
      readingViewModel: { chapter: buildChapterMeta(manifest || {}), views: [], diagnostics: [d] },
      diagnostics: [d],
    };
  }

  const consumedProjectionIds = new Set();
  const views = compositionSpec.views
    .slice()
    .sort(function (a, b) {
      return a.displayOrder - b.displayOrder;
    })
    .map(function (specView) {
      const resolvedSources = specView.sources.map(function (source) {
        return resolveSource(manifest, source, diagnostics, specView.viewId);
      });

      const projectionSources = specView.sources
        .map(function (source, index) {
          return { source, resolved: resolvedSources[index] };
        })
        .filter(function (entry) {
          return entry.source.kind === "projection";
        })
        .sort(function (a, b) {
          const orderA = a.source.mergeOrder ?? 999;
          const orderB = b.source.mergeOrder ?? 999;
          return orderA - orderB;
        });

      /** @type {Array<Record<string, unknown>>} */
      let blocks = [];
      for (const entry of projectionSources) {
        if (entry.resolved.resolved && entry.source.ref) {
          consumedProjectionIds.add(entry.source.ref);
        }
        blocks = blocks.concat(entry.resolved.blocks);
      }

      /** @type {Array<Record<string, unknown>>} */
      let questions = [];
      /** @type {Array<Record<string, unknown>>} */
      let scenarios = [];
      /** @type {Record<string, unknown> | null} */
      let collegeRef = null;

      for (const resolved of resolvedSources) {
        if (resolved.questions?.length) {
          questions = questions.concat(resolved.questions);
        }
        if (resolved.scenarios?.length) {
          scenarios = scenarios.concat(resolved.scenarios);
        }
        if (resolved.collegeRef) {
          collegeRef = resolved.collegeRef;
        }
      }

      const anyResolved = resolvedSources.some(function (r) {
        return r.resolved;
      });

      const availability = availabilityFromPolicy(specView.availabilityPolicy, anyResolved);

      if (
        specView.availabilityPolicy === "default" &&
        specView.sources.length > 0 &&
        !anyResolved
      ) {
        diagnostics.push(
          diagnostic(
            "view-without-resolved-source",
            "error",
            `View "${specView.viewId}" has no resolved sources`,
            { viewId: specView.viewId }
          )
        );
      }

      /** @type {Record<string, unknown>} */
      const viewEntry = {
        viewId: specView.viewId,
        label: specView.label,
        displayOrder: specView.displayOrder,
        availability,
      };

      if (blocks.length > 0) viewEntry.blocks = blocks;
      if (questions.length > 0) viewEntry.questions = questions;
      if (scenarios.length > 0) viewEntry.scenarios = scenarios;
      if (collegeRef) viewEntry.collegeRef = collegeRef;

      return viewEntry;
    });

  const projections = Array.isArray(manifest.projections) ? manifest.projections : [];
  for (const projection of projections) {
    if (!projection || !projection.id) continue;
    if (!isProjectionPublished(projection)) continue;
    if (isProjectionKnownAbsent(manifest, projection.id)) continue;
    if (!consumedProjectionIds.has(projection.id)) {
      diagnostics.push(
        diagnostic(
          "published-projection-unconsumed",
          "warn",
          `Published projection "${projection.id}" is not consumed by any view`,
          { projectionId: projection.id }
        )
      );
    }
  }

  const readingViewModel = {
    chapter: buildChapterMeta(manifest),
    views,
    diagnostics: diagnostics.slice(),
  };

  return { readingViewModel, diagnostics };
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {unknown} compositionSpec
 * @returns {{ readingViewModel: Record<string, unknown>, diagnostics: CompositionDiagnostic[], validation: { ok: boolean, errors: string[] } }}
 */
export function composeAndValidate(manifest, compositionSpec) {
  const result = compose(manifest, compositionSpec);
  const validation = validateReadingViewModel(result.readingViewModel);
  const contentErrors = [];
  assertNoMedicalContent(result.readingViewModel, "readingViewModel", contentErrors);
  if (contentErrors.length > 0) {
    validation.ok = false;
    validation.errors = validation.errors.concat(contentErrors);
  }
  return { ...result, validation };
}
