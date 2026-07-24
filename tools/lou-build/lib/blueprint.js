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

export function validateBlueprint(blueprint, inventoryIds) {
  const errors = [];
  const elementIds = new Set();
  const data = blueprint.data;

  if (!data.sequence || data.sequence.length === 0) {
    errors.push("blueprint: sequence must be non-empty");
  }

  const mechanisms = data.mechanisms || [];
  const mechanismIds = new Set();
  for (const mec of mechanisms) {
    if (!mec.id) errors.push("mechanism missing id");
    else mechanismIds.add(mec.id);
    elementIds.add(mec.id);
    if (!mec.question) errors.push(`${mec.id}: missing question`);
    if (!Array.isArray(mec.steps) || mec.steps.length === 0) {
      errors.push(`${mec.id}: missing steps`);
    }
    for (const kpId of mec.uses_kp || []) {
      if (!inventoryIds.has(kpId)) {
        errors.push(`${mec.id}: dangling KP reference ${kpId}`);
      }
    }
    if (mec.visual_intent && mec.id !== "MEC-oap") {
      /* slice allows visual only on MEC-oap */
    }
  }

  for (const conf of data.confusion || []) {
    if (conf.id) elementIds.add(conf.id);
    for (const kpId of conf.uses_kp || []) {
      if (!inventoryIds.has(kpId)) {
        errors.push(`${conf.id}: dangling KP reference ${kpId}`);
      }
    }
  }

  for (const seqId of data.sequence || []) {
    if (!mechanismIds.has(seqId) && !seqId.startsWith("CONF-")) {
      if (!mechanismIds.has(seqId)) {
        errors.push(`sequence references unknown element: ${seqId}`);
      }
    }
  }

  const mecOap = mechanisms.find((m) => m.id === "MEC-oap");
  if (!mecOap?.visual_intent) {
    errors.push("MEC-oap: visual_intent required for slice SVG");
  }

  return {
    ok: errors.length === 0,
    errors,
    elementIds,
    mecOap,
    mechanisms,
    confusion: data.confusion || [],
  };
}

export function getMechanism(blueprint, id) {
  return (blueprint.data.mechanisms || []).find((m) => m.id === id);
}
