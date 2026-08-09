/**
 * Extract learner-visible values from a visualSpec at declared consumption paths.
 */

function pushText(out, pathLabel, value, meta = {}) {
  const v = String(value ?? "").trim();
  if (!v) return;
  out.push({ path: pathLabel, value: v, type: "text", ...meta });
}

/** @param {object} spec */
export function extractConsumptionEntries(spec, consumePath) {
  const entries = [];
  switch (consumePath) {
    case "question":
      pushText(entries, "question", spec.question);
      break;
    case "nodes.label":
      for (const [i, node] of (spec.nodes || []).entries()) {
        pushText(entries, `nodes[${i}].label`, node.label, { nodeId: node.id });
      }
      break;
    case "nodes.kind":
      for (const [i, node] of (spec.nodes || []).entries()) {
        const kind = String(node.kind ?? "").trim();
        if (!kind) continue;
        entries.push({
          path: `nodes[${i}].kind`,
          value: kind,
          type: "node-kind",
          nodeId: node.id,
        });
      }
      break;
    case "nodes.subitems.label":
      for (const [i, node] of (spec.nodes || []).entries()) {
        for (const [si, sub] of (node.subitems || []).entries()) {
          pushText(entries, `nodes[${i}].subitems[${si}].label`, sub.label, {
            nodeId: node.id,
            subitemId: sub.id,
          });
        }
      }
      break;
    case "annotations.label":
      for (const [i, ann] of (spec.annotations || []).entries()) {
        pushText(entries, `annotations[${i}].label`, ann.label, { annotationId: ann.id });
      }
      break;
    case "branches.condition":
      for (const [i, branch] of (spec.branches || []).entries()) {
        pushText(entries, `branches[${i}].condition`, branch.condition, { branchId: branch.id });
      }
      break;
    case "poles.label":
      for (const [i, pole] of (spec.poles || []).entries()) {
        pushText(entries, `poles[${i}].label`, pole.label, { poleId: pole.id });
      }
      break;
    case "dimensions.label":
      for (const [i, dim] of (spec.dimensions || []).entries()) {
        pushText(entries, `dimensions[${i}].label`, dim.label, { dimensionId: dim.id });
      }
      break;
    case "dimensions.cells.items.label":
      for (const [di, dim] of (spec.dimensions || []).entries()) {
        for (const [ci, cell] of (dim.cells || []).entries()) {
          for (const [ii, item] of (cell.items || []).entries()) {
            pushText(
              entries,
              `dimensions[${di}].cells[${ci}].items[${ii}].label`,
              item.label,
              { itemId: item.id, poleId: cell.pole, dimensionId: dim.id },
            );
          }
        }
      }
      break;
    case "groups.items.label":
      for (const [gi, group] of (spec.groups || []).entries()) {
        for (const [ii, item] of (group.items || []).entries()) {
          pushText(
            entries,
            `groups[${gi}].items[${ii}].label`,
            item.label,
            { itemId: item.id, groupId: group.id },
          );
        }
      }
      break;
    case "set.label":
      if (spec.set?.label) pushText(entries, "set.label", spec.set.label);
      break;
    default:
      break;
  }
  return entries;
}

/** @param {object} spec @param {string[]} consumePaths */
export function extractAllConsumptionEntries(spec, consumePaths = []) {
  const all = [];
  for (const p of consumePaths) {
    all.push(...extractConsumptionEntries(spec, p));
  }
  return all;
}

export const KNOWN_CONSUMPTION_PATHS = Object.freeze([
  "question",
  "nodes.label",
  "nodes.kind",
  "nodes.subitems.label",
  "annotations.label",
  "branches.condition",
  "poles.label",
  "dimensions.label",
  "dimensions.cells.items.label",
  "groups.items.label",
  "set.label",
]);
