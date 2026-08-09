/**
 * SVG Graphic Language V1 — loader for svg-graphic-language-v1.yaml
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "yaml";
import { resolveRoleNodeStyle } from "./role-graphic-language.js";
import { themeKindKey } from "./kind-vocabulary.js";
import { nodeShape } from "./visual-grammar-runtime.js";

const DEFAULT_CONFIG_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../config/svg-graphic-language-v1.yaml",
);

const REQUIRED_SECTIONS = Object.freeze([
  "canvas",
  "typography",
  "colors",
  "stroke",
  "radius",
  "dash",
  "opacity",
  "connectors",
  "spacing",
  "node_kinds",
  "families",
]);

let cached = null;

export function resetSvgGraphicLanguageCache() {
  cached = null;
}

export function loadSvgGraphicLanguage(options = {}) {
  if (cached && !options.reload) return cached;

  const configPath = options.configPath || DEFAULT_CONFIG_PATH;
  if (!fs.existsSync(configPath)) {
    throw new Error(`SVG graphic language config missing: ${configPath}`);
  }

  const raw = yaml.parse(fs.readFileSync(configPath, "utf8"));
  for (const section of REQUIRED_SECTIONS) {
    if (raw[section] == null) {
      throw new Error(`SVG graphic language: missing required section "${section}"`);
    }
  }
  for (const family of ["decision_algorithm", "dependent_sequence", "chain", "two_pole"]) {
    if (!raw.families[family]) {
      throw new Error(`SVG graphic language: missing families.${family}`);
    }
  }

  cached = materialize(raw);
  return cached;
}

function materialize(raw) {
  return {
    raw,
    tokens: buildTokens(raw),
    w1VerticalLayout: buildW1VerticalLayout(raw),
    w1DecisionLayout: buildW1DecisionLayout(raw),
    decisionAlgorithmLayout: buildDecisionAlgorithmLayout(raw),
    twoPoleLayout: buildTwoPoleLayout(raw),
    nodeKinds: raw.node_kinds,
    stroke: raw.stroke,
    radius: raw.radius,
    dash: raw.dash,
    opacity: raw.opacity,
    connectors: raw.connectors,
    spacing: raw.spacing,
    colors: raw.colors,
    typography: raw.typography,
  };
}

function buildTokens(raw) {
  const { typography: t, colors: c, node_kinds: nk } = raw;
  return {
    fontStack: t.font_stack,
    canvas: raw.canvas.background,
    titleText: t.title.color,
    nodeText: t.label.color,
    connector: c.connector,
    accent: c.accent,
    rule: c.rule,
    nodeKind: {
      state: {
        fill: nk.state.fill,
        stroke: nk.state.stroke,
        strokeWidth: nk.state.stroke_width,
      },
      response: {
        fill: nk.response.fill,
        stroke: nk.response.stroke,
        strokeWidth: nk.response.stroke_width,
      },
      event: {
        fill: nk.event.fill,
        stroke: nk.event.stroke,
        strokeWidth: nk.event.stroke_width,
      },
    },
    nodeKindFallback: {
      fill: nk.state.fill,
      stroke: nk.state.stroke,
      strokeWidth: nk.state.stroke_width,
    },
    relation: {
      causes: { stroke: c.connector, width: raw.stroke.connector_w1, dash: null, marker: "vg-arrow-solid" },
      transmits: { stroke: c.connector, width: raw.stroke.connector_w1, dash: null, marker: "vg-arrow-flow" },
      feeds_back: { stroke: c.accent, width: raw.stroke.connector_w1, dash: "8 6", marker: "vg-arrow-accent" },
      contributes_to: { stroke: t.dimension_label.color, width: raw.stroke.connector_w1, dash: "5 5", marker: "vg-arrow-solid" },
      triggers_response: { stroke: t.dimension_label.color, width: raw.stroke.connector_w1, dash: "3 4", marker: "vg-arrow-solid" },
    },
    relationFallback: {
      stroke: c.connector,
      width: raw.stroke.connector_w1,
      dash: null,
      marker: "vg-arrow-solid",
    },
  };
}

function buildW1VerticalLayout(raw) {
  const f = raw.families.chain;
  const t = raw.typography;
  const s = raw.spacing;
  return {
    version: "svg-graphic-v1",
    fontSize: f.theme_label.size_px,
    fontWeight: t.label.weight,
    lineHeight: f.theme_label.line_height_px,
    titleFontSize: f.theme_title.size_px,
    titleFontWeight: t.title.weight,
    titleLineHeight: f.theme_title.line_height_px,
    nodeMinWidth: f.layout_node_min_width,
    nodeMaxWidth: f.layout_node_max_width,
    nodePaddingX: s.node_padding_x_chain,
    nodePaddingY: s.node_padding_y_chain,
    nodeMaxLines: f.layout_node_max_lines,
    rowGap: f.layout_row_gap,
    margin: f.layout_margin,
    titleBlock: f.layout_title_block,
    titleMaxLines: f.layout_title_max_lines,
    titlePaddingTop: s.title_padding_top,
    titlePaddingBottom: s.title_padding_bottom,
    cornerRadius: f.theme_corner_radius,
    textBaselineFactor: 0.75,
  };
}

function buildW1DecisionLayout(raw) {
  const f = raw.families.dependent_sequence;
  const t = raw.typography;
  const s = raw.spacing;
  return {
    version: "svg-graphic-v1",
    fontSize: f.theme_label.size_px,
    fontWeight: t.label.weight,
    lineHeight: f.theme_label.line_height_px,
    titleFontSize: f.theme_title.size_px,
    titleFontWeight: t.title.weight,
    titleLineHeight: f.theme_title.line_height_px,
    nodeMinWidth: f.layout_node_min_width,
    nodeMaxWidth: f.layout_node_max_width,
    nodePaddingX: s.node_padding_x_w1,
    nodePaddingY: s.node_padding_y_w1,
    nodeMaxLines: f.layout_node_max_lines,
    rowGap: f.layout_row_gap,
    margin: f.layout_margin,
    titleBlock: f.layout_title_block,
    titleMaxLines: f.layout_title_max_lines,
    titlePaddingTop: s.title_padding_top,
    titlePaddingBottom: s.title_padding_bottom,
    cornerRadius: f.theme_corner_radius,
    textBaselineFactor: 0.75,
    branchLabelFontSize: t.branch_label.size_px,
    branchLabelFontWeight: t.branch_label.weight,
    branchLabelLineHeight: t.branch_label.line_height_px,
    branchLabelMaxWidth: f.layout_branch_label_max_width ?? 200,
    subitemFontSize: t.sub.size_px,
    subitemLineHeight: Math.round(t.sub.size_px * 1.54 * 10) / 10,
    nodePaddingTopSubitems: s.node_padding_y_w1 + 2,
    nodePaddingBottomSubitems: s.node_padding_y_w1 + 2,
    subitemTitleToSeparator: 2,
    subitemSeparatorToList: 17,
    phaseLabelFontWeight: 700,
    subitemBulletIndent: 12,
    subitemItemGap: 5,
    annotationFontSize: t.annotation.size_px,
    annotationLineHeight: t.annotation.line_height_px,
    minBottomMargin: raw.families.decision_algorithm.layout_min_bottom_margin,
  };
}

function buildDecisionAlgorithmLayout(raw) {
  const f = raw.families.decision_algorithm;
  const t = raw.typography;
  const s = raw.spacing;
  const labelLh = Math.round(f.theme_label.size_px * 1.06 * 10) / 10;
  const branchLh = Math.round(f.theme_branch_label.size_px * 1.04 * 10) / 10;
  const subSize = f.theme_sub?.size_px ?? t.sub.size_px;
  return {
    fontSize: f.theme_label.size_px,
    fontWeight: t.label.weight,
    lineHeight: labelLh,
    titleFontSize: f.theme_title.size_px,
    titleFontWeight: t.title.weight,
    titleLineHeight: f.theme_title.line_height_px,
    nodeMinWidth: f.layout_node_min_width,
    nodeMaxWidth: f.layout_node_max_width,
    nodePaddingX: Math.round(s.node_padding_x_w1 * 1.28 * 10) / 10,
    nodePaddingY: Math.round(s.node_padding_y_w1 * 1.28 * 10) / 10,
    subitemFontSize: subSize,
    subitemLineHeight: Math.round(subSize * 1.42 * 10) / 10,
    layerGapY: f.layout_layer_gap_y,
    nodeGapX: f.layout_node_gap_x,
    branchLabelFontSize: f.theme_branch_label.size_px,
    branchLabelMaxWidth: f.layout_branch_label_max_width,
    branchLabelLineHeight: branchLh,
    margin: s.margin_decision,
    titleBlock: Math.round(s.title_block_w1 * 1.28 * 10) / 10,
    cornerRadius: f.theme_corner_radius,
    annotationFontSize: t.annotation.size_px,
    annotationLineHeight: t.annotation.line_height_px,
    fragmentFontSize: f.theme_fragment.size_px,
    fragmentLineHeight: f.theme_fragment.line_height_px,
    fragmentPadding: f.theme_fragment.padding,
    fragmentRadius: f.theme_fragment.radius,
    minBottomMargin: f.layout_min_bottom_margin,
    lateralCorridorPad: f.layout_lateral_corridor_pad,
  };
}

function buildTwoPoleLayout(raw) {
  const f = raw.families.two_pole;
  const t = raw.typography;
  const s = raw.spacing;
  const r = raw.radius;
  return {
    width: f.layout_canvas_width,
    margin: s.margin_two_pole,
    gutter: s.compare_gutter,
    titleFontSize: f.theme_title.size_px,
    titleFontWeight: t.title.weight,
    titleLineHeight: t.title.line_height_px,
    poleFontSize: t.pole_header.size_px,
    poleFontWeight: t.pole_header.weight,
    dimFontSize: t.dimension_label.size_px,
    dimFontWeight: t.dimension_label.weight,
    cellFontSize: t.cell.size_px,
    cellFontWeight: t.cell.weight,
    cellLineHeight: t.cell.line_height_px,
    cellPaddingX: s.cell_padding_x,
    cellPaddingY: s.cell_padding_y,
    dimBandPaddingY: s.band_padding_y,
    rowGap: f.layout_row_gap,
    headerGap: s.pole_header_gap,
    poleHeaderHeight: f.layout_pole_header_height,
    cornerRadius: r.pole_header,
    bandRadius: r.band,
    cellRadius: r.cell,
    dividerColor: raw.colors.divider,
    dimMuted: t.dimension_label.color,
    poleCrtFill: f.theme_pole_primary.fill,
    poleCrtStroke: f.theme_pole_primary.stroke,
    poleDaiFill: f.theme_pole_secondary.fill,
    poleDaiStroke: f.theme_pole_secondary.stroke,
    bandFill: f.theme_band.fill,
    bandStroke: f.theme_band.stroke,
    cellFill: f.theme_cell.fill,
    cellStroke: f.theme_cell.stroke,
    compareDividerOpacity: raw.opacity.compare_center_divider,
    compareCellLinkOpacity: raw.opacity.compare_cell_link,
    compareDividerDash: raw.dash.compare_divider,
    compareCellLinkDash: raw.dash.compare_cell_link,
    connectorCompareWidth: raw.stroke.connector_compare,
    connectorCompareDashedWidth: raw.stroke.connector_compare_dashed,
    nodePrimaryStrokeWidth: raw.stroke.node_primary,
    cellBulletIndent: 12,
    cellItemGap: 6,
    cellListFontWeight: 400,
  };
}

function lookupNodeKindStyle(kind, lang) {
  const key = themeKindKey(kind);
  const style = lang.nodeKinds[key];
  if (!style) {
    return { ...materializeNodeKindStyle("entry", lang.nodeKinds.entry) };
  }
  return resolveRoleNodeStyle(kind, materializeNodeKindStyle(key, style));
}

export function getDecisionNodeKindStyle(kind, lang = loadSvgGraphicLanguage()) {
  return lookupNodeKindStyle(kind, lang);
}

function materializeNodeKindStyle(kind, style) {
  return {
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.stroke_width,
    dash: style.dash ?? null,
    shape: nodeShape(kind),
  };
}

export function getW1DependentSequenceNodeStyle(kind, lang = loadSvgGraphicLanguage()) {
  return lookupNodeKindStyle(kind, lang);
}

const MARKER_IDS = Object.freeze({
  arrow_solid: "vg-arrow-solid",
  arrow_compare_left: "vg-compare-left",
  arrow_compare_right: "vg-compare-right",
});

export function markerSvg(connectorKey, lang = loadSvgGraphicLanguage(), options = {}) {
  const m = lang.connectors[connectorKey];
  if (!m) throw new Error(`SVG graphic language: unknown connector marker "${connectorKey}"`);
  const id = options.id || MARKER_IDS[connectorKey] || connectorKey.replace(/_/g, "-");
  const extra = options.markerUnits ? ` markerUnits="${options.markerUnits}"` : "";
  return (
    `<marker id="${id}" markerWidth="${m.marker_width}" markerHeight="${m.marker_height}" ` +
    `refX="${m.ref_x}" refY="${m.ref_y}" orient="auto"${extra}>` +
    `<path d="${m.path}" fill="${m.fill}"/></marker>`
  );
}
