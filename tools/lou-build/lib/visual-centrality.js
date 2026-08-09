/**
 * ADR-007 — visual centrality regime (build authority).
 *
 * Distinguishes walkthrough accessibility, block completeness, and Release qualification.
 * Legacy packages without `visual_centrality` remain consumable but never retroactively qualified.
 */

/** @typedef {'mental-model' | 'autonomous-notion' | 'mechanism' | 'confusion' | 'clinical-reasoning' | 'analogy'} EditorialType */
/** @typedef {'master' | 'central' | 'complementary'} VisualRole */
/** @typedef {'published' | 'planned-not-built' | 'built-but-withheld' | 'none-planned'} TechnicalAvailability */

export const EDITORIAL_TYPES = Object.freeze({
  MENTAL_MODEL: "mental-model",
  AUTONOMOUS_NOTION: "autonomous-notion",
  MECHANISM: "mechanism",
  CONFUSION: "confusion",
  CLINICAL_REASONING: "clinical-reasoning",
  ANALOGY: "analogy",
});

export const VISUAL_ROLES = Object.freeze({
  MASTER: "master",
  CENTRAL: "central",
  COMPLEMENTARY: "complementary",
});

export const AVAILABILITY = Object.freeze({
  PUBLISHED: "published",
  PLANNED_NOT_BUILT: "planned-not-built",
  BUILT_BUT_WITHHELD: "built-but-withheld",
  NONE_PLANNED: "none-planned",
});

export const REGIMES = Object.freeze({
  LEGACY: "legacy",
  ADR007: "adr-007",
});

export const VERDICTS = Object.freeze({
  LEGACY_UNQUALIFIED: "LEGACY_UNQUALIFIED",
  REFUSED: "REFUSED",
  INCOMPLETE_DEGRADED: "INCOMPLETE_DEGRADED",
  READY_FOR_RELEASE_QUALIFICATION: "READY_FOR_RELEASE_QUALIFICATION",
});

const MANDATORY_TYPES = new Set([
  EDITORIAL_TYPES.MENTAL_MODEL,
  EDITORIAL_TYPES.AUTONOMOUS_NOTION,
]);

const PRIMARY_ROLES = new Set([VISUAL_ROLES.MASTER, VISUAL_ROLES.CENTRAL]);

/**
 * @param {Record<string, unknown> | null | undefined} packageConfig
 * @returns {{ regime: string, blocks: Array<Record<string, unknown>> } | null}
 */
export function parseVisualCentralityContract(packageConfig) {
  const raw = packageConfig?.visual_centrality;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const regime =
    typeof raw.regime === "string" && raw.regime.trim()
      ? raw.regime.trim()
      : REGIMES.ADR007;
  const blocks = Array.isArray(raw.blocks) ? raw.blocks : [];
  return { regime, blocks };
}

/**
 * @param {Record<string, unknown>} visualBuild
 * @param {string} elementId
 * @returns {TechnicalAvailability}
 */
export function resolveTechnicalAvailability(visualBuild, elementId) {
  const rendered = visualBuild?.rendered || [];
  if (rendered.some((v) => v.elementId === elementId)) {
    return AVAILABILITY.PUBLISHED;
  }
  for (const p of visualBuild?.planned || []) {
    if (p.elementId === elementId) {
      return AVAILABILITY.PLANNED_NOT_BUILT;
    }
  }
  for (const w of visualBuild?.withheld || []) {
    if (w.elementId === elementId) {
      if (w.state === "planned-not-built") {
        return AVAILABILITY.PLANNED_NOT_BUILT;
      }
      return AVAILABILITY.BUILT_BUT_WITHHELD;
    }
  }
  return AVAILABILITY.NONE_PLANNED;
}

/**
 * @param {Record<string, unknown>} block
 * @returns {string[]}
 */
function validateBlockContractShape(block) {
  const errors = [];
  if (!block || typeof block !== "object") {
    return ["visual_centrality.blocks entry must be an object"];
  }
  if (typeof block.element !== "string" || !block.element.trim()) {
    errors.push("visual_centrality.blocks: missing element id");
  }
  if (
    typeof block.editorial_type !== "string" ||
    !Object.values(EDITORIAL_TYPES).includes(block.editorial_type)
  ) {
    errors.push(
      `visual_centrality.blocks[${block.element || "?"}]: invalid editorial_type`,
    );
  }
  if (
    typeof block.visual_role !== "string" ||
    !Object.values(VISUAL_ROLES).includes(block.visual_role)
  ) {
    errors.push(
      `visual_centrality.blocks[${block.element || "?"}]: invalid visual_role`,
    );
  }
  return errors;
}

/**
 * @param {Record<string, unknown>} blockContract
 * @param {TechnicalAvailability} availability
 * @param {{ walkthroughPublished?: boolean }} [opts]
 */
export function evaluateBlockCentrality(blockContract, availability, opts = {}) {
  const editorialType = blockContract.editorial_type;
  const visualRole = blockContract.visual_role;
  const congruence =
    typeof blockContract.congruence === "string"
      ? blockContract.congruence.trim().toLowerCase()
      : "pending";
  const deferrable = blockContract.deferrable === true;
  const walkthroughPublished = opts.walkthroughPublished !== false;

  const diagnostics = [];
  const mandatoryBlock = MANDATORY_TYPES.has(editorialType);
  const primaryRole = PRIMARY_ROLES.has(visualRole);

  if (
    mandatoryBlock &&
    primaryRole &&
    availability === AVAILABILITY.NONE_PLANNED
  ) {
    diagnostics.push(
      `${blockContract.element}: none-planned forbidden for ${editorialType}/${visualRole}`,
    );
  }

  if (
    editorialType === EDITORIAL_TYPES.AUTONOMOUS_NOTION &&
    visualRole === VISUAL_ROLES.COMPLEMENTARY
  ) {
    diagnostics.push(
      `${blockContract.element}: autonomous-notion cannot use complementary visual_role as central substitute`,
    );
  }

  const walkthroughAccessible = walkthroughPublished;

  let blockComplete = false;
  if (primaryRole && mandatoryBlock) {
    blockComplete =
      availability === AVAILABILITY.PUBLISHED && congruence === "pass";
  } else if (visualRole === VISUAL_ROLES.COMPLEMENTARY) {
    blockComplete = availability === AVAILABILITY.PUBLISHED || deferrable;
  } else {
    blockComplete =
      availability === AVAILABILITY.PUBLISHED ||
      availability === AVAILABILITY.NONE_PLANNED;
  }

  if (
    primaryRole &&
    mandatoryBlock &&
    availability !== AVAILABILITY.PUBLISHED
  ) {
    blockComplete = false;
  }
  if (primaryRole && mandatoryBlock && congruence !== "pass") {
    blockComplete = false;
  }

  const releaseQualifiable =
    blockComplete &&
    !(primaryRole && mandatoryBlock && availability !== AVAILABILITY.PUBLISHED);

  const degradedAccess =
    walkthroughAccessible &&
    primaryRole &&
    mandatoryBlock &&
    availability !== AVAILABILITY.PUBLISHED &&
    availability !== AVAILABILITY.NONE_PLANNED;

  return {
    element: blockContract.element,
    editorialType,
    visualRole,
    availability,
    congruence,
    deferrable,
    walkthroughAccessible,
    blockComplete,
    releaseQualifiable,
    degradedAccess,
    diagnostics,
  };
}

/**
 * @param {object} input
 * @param {Record<string, unknown> | null | undefined} input.packageConfig
 * @param {Record<string, unknown>} input.visualBuild
 * @param {Set<string>} [input.publishedWalkthroughElements]
 */
export function evaluateVisualCentrality({
  packageConfig,
  visualBuild,
  publishedWalkthroughElements,
}) {
  const contract = parseVisualCentralityContract(packageConfig);
  if (!contract) {
    return {
      regime: REGIMES.LEGACY,
      verdict: VERDICTS.LEGACY_UNQUALIFIED,
      releaseQualifiable: false,
      walkthroughAccessible: true,
      blocks: [],
      complementaryDebt: [],
      gateErrors: [],
      diagnostics: [
        "Package predates ADR-007 visual_centrality contract — consumable, not retroactively qualified",
      ],
    };
  }

  const gateErrors = [];
  const blocks = [];
  const complementaryDebt = [];
  const walkthroughSet =
    publishedWalkthroughElements instanceof Set
      ? publishedWalkthroughElements
      : null;

  let masterCount = 0;
  for (const raw of contract.blocks) {
    gateErrors.push(...validateBlockContractShape(raw));
    if (
      raw.editorial_type === EDITORIAL_TYPES.MENTAL_MODEL &&
      raw.visual_role === VISUAL_ROLES.MASTER
    ) {
      masterCount += 1;
    }
  }

  const mmBlocks = contract.blocks.filter(
    (b) => b.editorial_type === EDITORIAL_TYPES.MENTAL_MODEL,
  );
  if (contract.regime === REGIMES.ADR007 && mmBlocks.length > 0 && masterCount !== 1) {
    gateErrors.push(
      `visual_centrality: exactly one mental-model master required (found ${masterCount})`,
    );
  }

  for (const raw of contract.blocks) {
    const availability = resolveTechnicalAvailability(visualBuild, raw.element);
    const walkthroughPublished =
      !walkthroughSet || walkthroughSet.has(raw.element);
    const evaluated = evaluateBlockCentrality(raw, availability, {
      walkthroughPublished,
    });
    blocks.push(evaluated);

    for (const d of evaluated.diagnostics) {
      if (
        availability === AVAILABILITY.NONE_PLANNED &&
        PRIMARY_ROLES.has(raw.visual_role) &&
        MANDATORY_TYPES.has(raw.editorial_type)
      ) {
        gateErrors.push(`visual_centrality: ${d}`);
      } else if (
        raw.editorial_type === EDITORIAL_TYPES.AUTONOMOUS_NOTION &&
        raw.visual_role === VISUAL_ROLES.COMPLEMENTARY
      ) {
        gateErrors.push(`visual_centrality: ${d}`);
      }
    }

    if (
      raw.visual_role === VISUAL_ROLES.COMPLEMENTARY &&
      availability !== AVAILABILITY.PUBLISHED
    ) {
      complementaryDebt.push({
        element: raw.element,
        availability,
        deferrable: raw.deferrable === true,
        editorialType: raw.editorial_type,
      });
    }
  }

  const primaryMandatory = blocks.filter(
    (b) =>
      MANDATORY_TYPES.has(b.editorialType) && PRIMARY_ROLES.has(b.visualRole),
  );
  const releaseQualifiable =
    gateErrors.length === 0 &&
    primaryMandatory.length > 0 &&
    primaryMandatory.every((b) => b.blockComplete && b.releaseQualifiable);

  const walkthroughAccessible = blocks.every((b) => b.walkthroughAccessible);

  let verdict = VERDICTS.INCOMPLETE_DEGRADED;
  if (gateErrors.length > 0) {
    verdict = VERDICTS.REFUSED;
  } else if (releaseQualifiable) {
    verdict = VERDICTS.READY_FOR_RELEASE_QUALIFICATION;
  }

  return {
    regime: contract.regime,
    verdict,
    releaseQualifiable,
    walkthroughAccessible,
    blocks,
    complementaryDebt,
    gateErrors,
    diagnostics: [],
  };
}

/**
 * @param {ReturnType<typeof evaluateVisualCentrality>} report
 * @param {Record<string, unknown> | null | undefined} packageConfig
 * @param {{ evaluationConfig?: { completeness_level?: string } | null } | null | undefined} [evaluation]
 * @returns {string[]}
 */
export function visualCentralityGateErrors(
  report,
  packageConfig,
  evaluation = null,
) {
  const errors = [];
  if (!report) return errors;

  if (report.regime === REGIMES.ADR007) {
    errors.push(...(report.gateErrors || []));
  }

  const claimsComplete =
    packageConfig?.editorial_completeness === "complete" ||
    evaluation?.evaluationConfig?.completeness_level === "complete";

  if (
    report.regime === REGIMES.ADR007 &&
    claimsComplete &&
    !report.releaseQualifiable
  ) {
    errors.push(
      "visual_centrality: editorial_completeness complete but Release not qualifiable under ADR-007",
    );
  }

  return errors;
}

/** Mutant fixtures — must be rejected by gate. */
export const MUTANT_MM_NONE_PLANNED = {
  id: "mm-none-planned",
  packageConfig: {
    slug: "mutant",
    title: "Mutant",
    mode: "slice",
    visual_centrality: {
      regime: "adr-007",
      blocks: [
        {
          element: "MM-missing",
          editorial_type: "mental-model",
          visual_role: "master",
          congruence: "pass",
        },
      ],
    },
  },
  visualBuild: { rendered: [], planned: [], withheld: [] },
};

export const MUTANT_NOTION_NONE_PLANNED = {
  id: "notion-none-planned",
  packageConfig: {
    slug: "mutant",
    title: "Mutant",
    mode: "slice",
    visual_centrality: {
      regime: "adr-007",
      blocks: [
        {
          element: "NOT-missing",
          editorial_type: "autonomous-notion",
          visual_role: "central",
          congruence: "pass",
        },
      ],
    },
  },
  visualBuild: { rendered: [], planned: [], withheld: [] },
};

export const MUTANT_COMPLEMENT_AS_CENTRAL = {
  id: "complement-as-central",
  packageConfig: {
    slug: "mutant",
    title: "Mutant",
    mode: "slice",
    visual_centrality: {
      regime: "adr-007",
      blocks: [
        {
          element: "NOT-wrong-role",
          editorial_type: "autonomous-notion",
          visual_role: "complementary",
          deferrable: true,
          congruence: "pass",
        },
      ],
    },
  },
  visualBuild: {
    rendered: [{ elementId: "NOT-wrong-role", relPath: "figures/x.svg" }],
    planned: [],
    withheld: [],
  },
};

export function validateVisualCentralityMutants() {
  const cases = [
    MUTANT_MM_NONE_PLANNED,
    MUTANT_NOTION_NONE_PLANNED,
    MUTANT_COMPLEMENT_AS_CENTRAL,
  ];
  const results = [];
  for (const c of cases) {
    const report = evaluateVisualCentrality({
      packageConfig: c.packageConfig,
      visualBuild: c.visualBuild,
    });
    const errors = visualCentralityGateErrors(report, c.packageConfig);
    results.push({
      id: c.id,
      failedAsExpected: errors.length > 0,
      errors,
      verdict: report.verdict,
    });
  }
  return results;
}

/**
 * @param {ReturnType<typeof evaluateVisualCentrality>} report
 */
export function serializeManifestVisualCentrality(report) {
  if (!report) return undefined;
  return {
    regime: report.regime,
    verdict: report.verdict,
    releaseQualifiable: report.releaseQualifiable,
    walkthroughAccessible: report.walkthroughAccessible,
    blocks: (report.blocks || []).map((b) => ({
      element: b.element,
      editorialType: b.editorialType,
      visualRole: b.visualRole,
      availability: b.availability,
      congruence: b.congruence,
      deferrable: b.deferrable === true,
      walkthroughAccessible: b.walkthroughAccessible,
      blockComplete: b.blockComplete,
      releaseQualifiable: b.releaseQualifiable,
      degradedAccess: b.degradedAccess === true,
      diagnostics: b.diagnostics || [],
    })),
    complementaryDebt: report.complementaryDebt || [],
  };
}
