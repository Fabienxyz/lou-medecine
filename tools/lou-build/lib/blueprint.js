import YAML from "yaml";

export function parseBlueprint(filePath, raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`Blueprint missing YAML frontmatter: ${filePath}`);
  }
  const data = YAML.parse(match[1]);
  const body = match[2];
  return { data, body, raw };
}

// `mental_model` accepts either a bare element id or `{ id, question }`. The mental model is
// projected as a pedagogical block like any other element, so it carries a learner-facing
// question; the bare-string form predates that and stays readable.
export function mentalModel(data) {
  const mm = data?.mental_model;
  if (!mm) return null;
  return typeof mm === "string" ? { id: mm } : mm;
}

export function collectBlueprintElementIds(data) {
  const ids = new Set();
  const mm = mentalModel(data);
  if (mm?.id) ids.add(mm.id);
  for (const mec of data.mechanisms || []) {
    if (mec.id) ids.add(mec.id);
  }
  for (const conf of data.confusion || []) {
    if (conf.id) ids.add(conf.id);
  }
  for (const cr of data.clinical_reasoning || []) {
    if (cr.id) ids.add(cr.id);
  }
  for (const ana of data.analogies || []) {
    if (ana.id) ids.add(ana.id);
  }
  return ids;
}

export function collectElementsWithVisualIntent(data) {
  const elements = [];
  for (const mec of data.mechanisms || []) {
    if (mec.visual_intent) {
      elements.push({ ...mec, kind: "mechanism" });
    }
  }
  for (const cr of data.clinical_reasoning || []) {
    if (cr.visual_intent) {
      elements.push({ ...cr, kind: "clinical_reasoning" });
    }
  }
  return elements;
}

function validateUsesKp(elementId, usesKp, inventoryIds, errors) {
  for (const kpId of usesKp || []) {
    if (!inventoryIds.has(kpId)) {
      errors.push(`${elementId}: dangling KP reference ${kpId}`);
    }
  }
}

export function validateBlueprint(blueprint, inventoryIds) {
  const errors = [];
  const data = blueprint.data;

  if (!data.sequence || data.sequence.length === 0) {
    errors.push("blueprint: sequence must be non-empty");
  }

  const elementIds = collectBlueprintElementIds(data);
  const mechanisms = data.mechanisms || [];

  const mm = mentalModel(data);
  if (mm && !mm.id) errors.push("mental_model missing id");
  if (mm && !mm.question) {
    errors.push(`${mm.id || "mental_model"}: missing question`);
  }

  for (const mec of mechanisms) {
    if (!mec.id) errors.push("mechanism missing id");
    if (!mec.question) errors.push(`${mec.id || "?"}: missing question`);
    if (!Array.isArray(mec.steps) || mec.steps.length === 0) {
      errors.push(`${mec.id || "?"}: missing steps`);
    }
    validateUsesKp(mec.id, mec.uses_kp, inventoryIds, errors);
  }

  for (const conf of data.confusion || []) {
    validateUsesKp(conf.id, conf.uses_kp, inventoryIds, errors);
  }

  for (const cr of data.clinical_reasoning || []) {
    if (!cr.id) errors.push("clinical_reasoning element missing id");
    if (!cr.question) errors.push(`${cr.id || "?"}: missing question`);
    validateUsesKp(cr.id, cr.uses_kp, inventoryIds, errors);
  }

  for (const ana of data.analogies || []) {
    if (!ana.id) errors.push("analogy missing id");
    validateUsesKp(ana.id, ana.uses_kp, inventoryIds, errors);
  }

  for (const seqId of data.sequence || []) {
    if (!elementIds.has(seqId)) {
      errors.push(`sequence references unknown element: ${seqId}`);
    }
  }

  const visualElements = collectElementsWithVisualIntent(data);

  return {
    ok: errors.length === 0,
    errors,
    elementIds,
    mechanisms,
    confusion: data.confusion || [],
    clinicalReasoning: data.clinical_reasoning || [],
    mentalModel: mm,
    visualElements,
  };
}

export function getMechanism(blueprint, id) {
  return (blueprint.data.mechanisms || []).find((m) => m.id === id);
}
