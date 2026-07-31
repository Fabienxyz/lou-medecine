/** Reading View Model V1 — minimal structural validator (Lot B). */

const CHAPTER_KEYS = new Set(["id", "title", "specialty", "edition", "slug", "chapterLine", "traceIndexRef"]);
const VIEW_KEYS = new Set([
  "viewId",
  "label",
  "displayOrder",
  "availability",
  "blocks",
  "questions",
  "scenarios",
  "collegeRef",
]);
const BLOCK_KEYS = new Set([
  "elementId",
  "sourceProjectionId",
  "pedagogicalOrder",
  "artifactRef",
]);
const QUESTION_KEYS = new Set(["questionId", "path", "status"]);
const SCENARIO_KEYS = new Set(["scenarioId", "kind", "path", "status"]);
const COLLEGE_REF_KEYS = new Set(["ref", "path", "value"]);

const FORBIDDEN_NESTED = new Set([
  "officialContent",
  "walkthrough",
  "question",
  "html",
  "markdown",
  "navigation",
  "learnerAffordances",
  "traceReferences",
  "composedAt",
  "manifestFingerprint",
]);

const AVAILABILITY_STATES = new Set([
  "published",
  "planned",
  "known_absent",
  "withheld",
  "invalid",
  "empty",
]);

/**
 * @param {unknown} viewModel
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateReadingViewModel(viewModel) {
  const errors = [];

  if (viewModel === null || typeof viewModel !== "object" || Array.isArray(viewModel)) {
    return { ok: false, errors: ["viewModel must be a plain object"] };
  }

  for (const key of Object.keys(viewModel)) {
    if (key !== "chapter" && key !== "views" && key !== "diagnostics") {
      errors.push(`forbidden root field: ${key}`);
    }
    if (FORBIDDEN_NESTED.has(key)) {
      errors.push(`forbidden root field: ${key}`);
    }
  }

  if (!viewModel.chapter || typeof viewModel.chapter !== "object") {
    errors.push("chapter is required");
  } else {
    for (const key of Object.keys(viewModel.chapter)) {
      if (!CHAPTER_KEYS.has(key)) {
        errors.push(`chapter: forbidden field: ${key}`);
      }
    }
    if (!viewModel.chapter.id) {
      errors.push("chapter.id is required");
    }
  }

  if (!Array.isArray(viewModel.views)) {
    errors.push("views must be an array");
  } else if (viewModel.views.length !== 7) {
    errors.push(`views must contain exactly 7 entries (got ${viewModel.views.length})`);
  } else {
    viewModel.views.forEach(function (view, index) {
      validateView(view, `views[${index}]`, errors);
    });
  }

  if (!Array.isArray(viewModel.diagnostics)) {
    errors.push("diagnostics must be an array");
  }

  return { ok: errors.length === 0, errors };
}

function validateView(view, prefix, errors) {
  if (view === null || typeof view !== "object" || Array.isArray(view)) {
    errors.push(`${prefix} must be a plain object`);
    return;
  }

  for (const key of Object.keys(view)) {
    if (!VIEW_KEYS.has(key)) {
      errors.push(`${prefix}: forbidden field: ${key}`);
    }
    if (FORBIDDEN_NESTED.has(key)) {
      errors.push(`${prefix}: forbidden field: ${key}`);
    }
  }

  for (const required of ["viewId", "label", "displayOrder", "availability"]) {
    if (!(required in view)) {
      errors.push(`${prefix}: missing ${required}`);
    }
  }

  if (view.availability && !AVAILABILITY_STATES.has(view.availability)) {
    errors.push(`${prefix}: invalid availability "${view.availability}"`);
  }

  if ("blocks" in view) {
    if (!Array.isArray(view.blocks)) {
      errors.push(`${prefix}.blocks must be an array`);
    } else {
      view.blocks.forEach(function (block, i) {
        validateBlock(block, `${prefix}.blocks[${i}]`, errors);
      });
    }
  }

  if ("questions" in view) {
    if (!Array.isArray(view.questions)) {
      errors.push(`${prefix}.questions must be an array`);
    } else {
      view.questions.forEach(function (q, i) {
        validateQuestion(q, `${prefix}.questions[${i}]`, errors);
      });
    }
  }

  if ("scenarios" in view) {
    if (!Array.isArray(view.scenarios)) {
      errors.push(`${prefix}.scenarios must be an array`);
    } else {
      view.scenarios.forEach(function (s, i) {
        validateScenario(s, `${prefix}.scenarios[${i}]`, errors);
      });
    }
  }

  if ("collegeRef" in view && view.collegeRef !== null) {
    validateCollegeRef(view.collegeRef, `${prefix}.collegeRef`, errors);
  }
}

function validateBlock(block, prefix, errors) {
  if (block === null || typeof block !== "object" || Array.isArray(block)) {
    errors.push(`${prefix} must be a plain object`);
    return;
  }
  for (const key of Object.keys(block)) {
    if (!BLOCK_KEYS.has(key)) {
      errors.push(`${prefix}: forbidden field: ${key}`);
    }
    if (FORBIDDEN_NESTED.has(key)) {
      errors.push(`${prefix}: forbidden field: ${key}`);
    }
  }
  for (const required of ["elementId", "sourceProjectionId", "pedagogicalOrder", "artifactRef"]) {
    if (!(required in block)) {
      errors.push(`${prefix}: missing ${required}`);
    }
  }
}

function validateQuestion(q, prefix, errors) {
  for (const key of Object.keys(q)) {
    if (!QUESTION_KEYS.has(key)) {
      errors.push(`${prefix}: forbidden field: ${key}`);
    }
  }
}

function validateScenario(s, prefix, errors) {
  for (const key of Object.keys(s)) {
    if (!SCENARIO_KEYS.has(key)) {
      errors.push(`${prefix}: forbidden field: ${key}`);
    }
  }
}

function validateCollegeRef(ref, prefix, errors) {
  for (const key of Object.keys(ref)) {
    if (!COLLEGE_REF_KEYS.has(key)) {
      errors.push(`${prefix}: forbidden field: ${key}`);
    }
  }
}

/** @param {unknown} value */
export function assertNoMedicalContent(value, path, errors) {
  if (value === null || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(function (item, i) {
      assertNoMedicalContent(item, `${path}[${i}]`, errors);
    });
    return;
  }
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_NESTED.has(key)) {
      errors.push(`${path}.${key}: forbidden content field`);
    }
    assertNoMedicalContent(value[key], `${path}.${key}`, errors);
  }
}
