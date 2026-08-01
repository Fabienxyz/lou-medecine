/**
 * Lot D6-C — Local Search extraction (index_schema_version = 1).
 * Pure functions — no I/O, no DOM.
 */

import {
    normText,
    normTextPreserveCase,
    UNIT_SEPARATOR,
    DIAGNOSTICS,
} from "./local-search-normalize.js";

const ANCHOR_RE = /\{#([a-zA-Z0-9_-]+)\}/g;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
const FENCED_CODE_RE = /```[\s\S]*?```/g;
const IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g;
const LINK_INLINE_RE = /\[([^\]]+)\]\([^)]*\)/g;
const LINK_REF_RE = /\[([^\]]+)\]\[[^\]]*\]/g;
const EMPHASIS_RE = /(\*\*|__|\*|_)(.*?)\1/g;
const INLINE_CODE_RE = /`([^`]+)`/g;
const ATX_HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
const LIST_PREFIX_RE = /^(\s*)[-*+]\s+/;
const ORDERED_LIST_RE = /^(\s*)\d+\.\s+/;
const BLOCKQUOTE_RE = /^>\s?/;
const TABLE_ROW_RE = /^\|.+\|$/;
const TABLE_SEP_RE = /^\|[\s\-:|]+\|$/;

function stripFrontmatter(text) {
    return text.replace(FRONTMATTER_RE, "");
}

function stripHtmlComments(text) {
    return text.replace(HTML_COMMENT_RE, "");
}

function stripFencedCode(text) {
    return text.replace(FENCED_CODE_RE, "");
}

function extractAnchors(text) {
    const anchors = [];
    let match;
    const re = new RegExp(ANCHOR_RE.source, "g");
    while ((match = re.exec(text)) !== null) {
        anchors.push({ id: match[1], index: match.index, length: match[0].length });
    }
    return anchors;
}

function removeAnchors(text) {
    return text.replace(ANCHOR_RE, "");
}

function stripInlineMarkdown(line) {
    let s = line;
    s = s.replace(IMAGE_RE, "");
    s = s.replace(LINK_INLINE_RE, "$1");
    s = s.replace(LINK_REF_RE, "$1");
    s = s.replace(INLINE_CODE_RE, "$1");
    let prev;
    do {
        prev = s;
        s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
        s = s.replace(/__([^_]+)__/g, "$1");
        s = s.replace(/\*([^*]+)\*/g, "$1");
        s = s.replace(/_([^_]+)_/g, "$1");
    } while (s !== prev);
    return s;
}

function stripListPrefix(line) {
    if (TABLE_ROW_RE.test(line) && !TABLE_SEP_RE.test(line)) {
        return line
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => cell.trim())
            .filter(Boolean)
            .join(" ");
    }
    if (TABLE_SEP_RE.test(line)) {
        return "";
    }
    let s = line;
    s = s.replace(BLOCKQUOTE_RE, "");
    s = s.replace(LIST_PREFIX_RE, "");
    s = s.replace(ORDERED_LIST_RE, "");
    return s;
}

function cleanProseLine(line) {
    let s = stripInlineMarkdown(line);
    s = stripListPrefix(s);
    s = removeAnchors(s);
    return s.trim();
}

function joinProseLines(lines) {
    return lines.filter(Boolean).join("\n").trim();
}

function parseHeadingLine(line) {
    const m = line.match(ATX_HEADING_RE);
    if (!m) {
        return null;
    }
    const level = m[1].length;
    let rawTitle = m[2];
    const anchors = extractAnchors(rawTitle);
    const elementAnchor = anchors.find((a) => !a.id.startsWith("cb-"));
    rawTitle = removeAnchors(rawTitle).replace(/^#+\s*/, "").trim();
    return {
        level,
        title: normTextPreserveCase(rawTitle),
        elementId: elementAnchor ? elementAnchor.id : null,
    };
}

function splitByContentBlocks(text) {
    const segments = [];
    const re = new RegExp(ANCHOR_RE.source, "g");
    let lastIndex = 0;
    let lastBlockId = null;
    let match;
    while ((match = re.exec(text)) !== null) {
        const id = match[1];
        if (id.startsWith("cb-")) {
            const before = text.slice(lastIndex, match.index).trim();
            if (before) {
                segments.push({ kind: lastBlockId ? "block" : "element", blockId: lastBlockId, text: before });
            }
            lastBlockId = id;
            lastIndex = match.index + match[0].length;
        }
    }
    const tail = text.slice(lastIndex).trim();
    if (tail) {
        segments.push({ kind: "block", blockId: lastBlockId, text: tail });
    } else if (segments.length === 0 && text.trim()) {
        segments.push({ kind: "element", blockId: null, text: text.trim() });
    }
    return segments;
}

function makeElementAnchor(elementId, blockAnchor) {
    const anchor = { kind: "element_block", elementId };
    if (blockAnchor) {
        anchor.blockAnchor = blockAnchor;
    }
    return anchor;
}

function makeCollegeAnchor(path) {
    return { kind: "section_path", path: path.slice() };
}

function makeQuestionAnchor(questionId) {
    return { kind: "question_id", questionId };
}

function makeScenarioAnchor(scenarioId, segmentId) {
    const anchor = { kind: "scenario_scroll", scenarioId };
    if (segmentId) {
        anchor.segmentId = segmentId;
    }
    return anchor;
}

function makeManifestAltAnchor(elementId, visualId) {
    return { kind: "manifest_alt", elementId, visualId };
}

function makeViewEntryAnchor() {
    return { kind: "view_entry" };
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function buildPassage(fieldPath, sourceOrdinal, rawText) {
    const normalizedText = normText(rawText);
    if (!normalizedText) {
        return null;
    }
    return {
        fieldPath,
        sourceOrdinal,
        normalizedText,
        rawText: rawText.trim(),
    };
}

/**
 * Extract units from projection or college markdown.
 */
export function extractMarkdownUnits(content, mode) {
    const diagnostics = [];
    if (typeof content !== "string" || content.includes("\uFFFD")) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    let body = stripFrontmatter(content);
    body = stripHtmlComments(body);
    body = stripFencedCode(body);
    body = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const lines = body.split("\n");
    const units = [];
    const headingStack = [];
    let currentElementId = null;
    let proseBuffer = [];

    function flushProse() {
        if (!proseBuffer.length) {
            return;
        }
        const rawJoined = joinProseLines(proseBuffer);
        proseBuffer = [];
        if (!rawJoined) {
            return;
        }

        if (mode === "college") {
            const path = headingStack.map((h) => h.title);
            const unitId = path.join(UNIT_SEPARATOR);
            const cleaned = joinProseLines(rawJoined.split("\n").map(cleanProseLine));
            if (!cleaned) {
                return;
            }
            units.push({
                unitType: "college_section",
                unitId,
                anchor: makeCollegeAnchor(path),
                passages: [buildPassage("body", 0, cleaned)].filter(Boolean),
            });
            return;
        }

        const segments = splitByContentBlocks(rawJoined);
        for (const segment of segments) {
            const cleanedText = joinProseLines(segment.text.split("\n").map(cleanProseLine));
            if (!cleanedText) {
                continue;
            }
            if (segment.kind === "element" || !segment.blockId) {
                if (!currentElementId) {
                    continue;
                }
                let elementUnit = units.find((u) => u.unitType === "element" && u.unitId === currentElementId);
                if (!elementUnit) {
                    elementUnit = {
                        unitType: "element",
                        unitId: currentElementId,
                        anchor: makeElementAnchor(currentElementId, null),
                        passages: [],
                    };
                    units.push(elementUnit);
                }
                const passage = buildPassage("body", elementUnit.passages.length, cleanedText);
                if (!passage) {
                    continue;
                }
                passage.sourceOrdinal = elementUnit.passages.length;
                elementUnit.passages.push(passage);
            } else {
                const passage = buildPassage("body", 0, cleanedText);
                if (!passage) {
                    continue;
                }
                units.push({
                    unitType: "content_block",
                    unitId: segment.blockId,
                    anchor: makeElementAnchor(currentElementId, segment.blockId),
                    passages: [passage],
                });
            }
        }
    }

    for (const line of lines) {
        const heading = parseHeadingLine(line);
        if (heading) {
            flushProse();
            while (headingStack.length && headingStack[headingStack.length - 1].level >= heading.level) {
                headingStack.pop();
            }
            headingStack.push(heading);

            if (mode === "college") {
                const path = headingStack.map((h) => h.title);
                currentElementId = null;
                continue;
            } else if (heading.elementId) {
                currentElementId = heading.elementId;
                units.push({
                    unitType: "element",
                    unitId: heading.elementId,
                    anchor: makeElementAnchor(heading.elementId, null),
                    passages: [],
                });
            }
            continue;
        }
        if (line.trim() === "") {
            if (proseBuffer.length) {
                proseBuffer.push("");
            }
            continue;
        }
        proseBuffer.push(line);
    }
    flushProse();

    if (mode === "college") {
        return { units: units.filter((u) => u.passages.length > 0), diagnostics };
    }

    return { units: units.filter((u) => u.passages.length > 0), diagnostics };
}

function readScalar(lines, startIndex, baseIndent) {
    const line = lines[startIndex];
    const blockMatch = line.match(/^(\s*)(text|label|explanation|feedback):\s*\|\s*$/);
    if (blockMatch) {
        const content = [];
        for (let i = startIndex + 1; i < lines.length; i += 1) {
            const l = lines[i];
            if (!l.trim()) {
                content.push("");
                continue;
            }
            const indentMatch = l.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1].length : 0;
            if (indent <= baseIndent) {
                break;
            }
            content.push(l.slice(baseIndent + 2));
        }
        return { value: content.join("\n").replace(/\n+$/, ""), nextIndex: startIndex + content.length + 1 };
    }
    const foldedMatch = line.match(/^(\s*)text:\s*>\s*$/);
    if (foldedMatch) {
        const parts = [];
        for (let i = startIndex + 1; i < lines.length; i += 1) {
            const l = lines[i];
            if (!l.trim()) {
                break;
            }
            const indentMatch = l.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1].length : 0;
            if (indent <= baseIndent) {
                break;
            }
            parts.push(l.slice(baseIndent + 2).trim());
        }
        return { value: parts.join(" "), nextIndex: startIndex + parts.length + 1 };
    }
    const inlineMatch = line.match(/^(\s*)text:\s*(.+)$/);
    if (inlineMatch) {
        let val = inlineMatch[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        return { value: val, nextIndex: startIndex + 1 };
    }
    const labelMatch = line.match(/^(\s*)label:\s*(.+)$/);
    if (labelMatch) {
        let val = labelMatch[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        return { value: val, nextIndex: startIndex + 1 };
    }
    const feedbackMatch = line.match(/^(\s*)feedback:\s*(.+)$/);
    if (feedbackMatch) {
        let val = feedbackMatch[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        return { value: val, nextIndex: startIndex + 1 };
    }
    const promptFolded = line.match(/^(\s*)prompt:\s*>\s*$/);
    if (promptFolded) {
        const parts = [];
        const indent = promptFolded[1].length;
        for (let i = startIndex + 1; i < lines.length; i += 1) {
            const l = lines[i];
            if (!l.trim()) {
                break;
            }
            const indentMatch = l.match(/^(\s*)/);
            const lineIndent = indentMatch ? indentMatch[1].length : 0;
            if (lineIndent <= indent) {
                break;
            }
            parts.push(l.slice(indent + 2).trim());
        }
        return { value: parts.join(" "), nextIndex: startIndex + parts.length + 1 };
    }
    const promptInline = line.match(/^(\s*)prompt:\s*(.+)$/);
    if (promptInline) {
        let val = promptInline[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        return { value: val, nextIndex: startIndex + 1 };
    }
    return { value: null, nextIndex: startIndex + 1 };
}

function parseRootScalar(lines, key) {
    const re = new RegExp(`^${key}:\\s*(.+)$`);
    for (const line of lines) {
        const m = line.match(re);
        if (m) {
            let val = m[1].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            return val;
        }
    }
    return null;
}

/**
 * Extract units from question YAML.
 */
export function extractQuestionUnits(content, questionIdFallback) {
    const diagnostics = [];
    if (typeof content !== "string" || content.includes("\uFFFD")) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const status = parseRootScalar(lines, "status");
    const questionId = parseRootScalar(lines, "question_id") || questionIdFallback;
    if (status !== "published") {
        diagnostics.push(DIAGNOSTICS.ARTIFACT_SKIPPED);
        return { units: [], diagnostics };
    }
    if (!questionId) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    const passages = [];
    const stemIndex = lines.findIndex((l) => /^stem:\s*$/.test(l));
    if (stemIndex >= 0) {
        for (let j = stemIndex + 1; j < lines.length; j += 1) {
            if (/^[a-z_]+:\s*$/.test(lines[j]) && !/^\s/.test(lines[j]) && !/^stem:/.test(lines[j])) {
                break;
            }
            if (/^\s*text:/.test(lines[j])) {
                const indentMatch = lines[j].match(/^(\s*)/);
                const baseIndent = indentMatch ? indentMatch[1].length : 0;
                const { value } = readScalar(lines, j, baseIndent);
                if (value) {
                    passages.push(buildPassage("stem.text", passages.length, value));
                }
                break;
            }
        }
    }

    const optionsIndex = lines.findIndex((l) => /^options:\s*$/.test(l));
    if (optionsIndex >= 0) {
        let optionIdx = -1;
        for (let j = optionsIndex + 1; j < lines.length; j += 1) {
            if (/^[a-z_]+:/.test(lines[j]) && !/^\s/.test(lines[j])) {
                break;
            }
            if (/^\s{2}- id:/.test(lines[j])) {
                optionIdx += 1;
                continue;
            }
            if (/^\s*label:/.test(lines[j]) && optionIdx >= 0) {
                const indentMatch = lines[j].match(/^(\s*)/);
                const baseIndent = indentMatch ? indentMatch[1].length : 0;
                const { value } = readScalar(lines, j, baseIndent);
                if (value) {
                    passages.push(buildPassage(`options[${optionIdx}].label`, passages.length, value));
                }
            }
            if (/^\s*explanation:/.test(lines[j]) && optionIdx >= 0) {
                const indentMatch = lines[j].match(/^(\s*)/);
                const baseIndent = indentMatch ? indentMatch[1].length : 0;
                const { value } = readScalar(lines, j, baseIndent);
                if (value) {
                    passages.push(buildPassage(`options[${optionIdx}].explanation`, passages.length, value));
                }
            }
        }
    }

    const normalizedPassages = passages.filter(Boolean).map((p, idx) => ({
        ...p,
        sourceOrdinal: idx,
    }));

    if (!normalizedPassages.length) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    return {
        units: [
            {
                unitType: "question",
                unitId: questionId,
                anchor: makeQuestionAnchor(questionId),
                passages: normalizedPassages,
            },
        ],
        diagnostics,
    };
}

/**
 * Extract units from scenario YAML.
 */
export function extractScenarioUnits(content, scenarioIdFallback) {
    const diagnostics = [];
    if (typeof content !== "string" || content.includes("\uFFFD")) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const status = parseRootScalar(lines, "status");
    const scenarioId = parseRootScalar(lines, "scenario_id") || scenarioIdFallback;
    if (status !== "published") {
        diagnostics.push(DIAGNOSTICS.ARTIFACT_SKIPPED);
        return { units: [], diagnostics };
    }
    if (!scenarioId) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    const units = [];
    const title = parseRootScalar(lines, "title");
    if (title) {
        const passage = buildPassage("title", 0, title);
        if (passage) {
            units.push({
                unitType: "scenario",
                unitId: scenarioId,
                anchor: makeScenarioAnchor(scenarioId),
                passages: [passage],
            });
        }
    }

    const situationIndex = lines.findIndex((l) => /^situation:\s*$/.test(l));
    if (situationIndex >= 0) {
        for (let j = situationIndex + 1; j < lines.length; j += 1) {
            if (/^\s*text:/.test(lines[j])) {
                const indentMatch = lines[j].match(/^(\s*)/);
                const baseIndent = indentMatch ? indentMatch[1].length : 0;
                const { value } = readScalar(lines, j, baseIndent);
                if (value) {
                    let scenarioUnit = units.find((u) => u.unitType === "scenario" && u.unitId === scenarioId);
                    if (!scenarioUnit) {
                        scenarioUnit = {
                            unitType: "scenario",
                            unitId: scenarioId,
                            anchor: makeScenarioAnchor(scenarioId),
                            passages: [],
                        };
                        units.push(scenarioUnit);
                    }
                    const passage = buildPassage("situation.text", scenarioUnit.passages.length, value);
                    if (passage) {
                        passage.sourceOrdinal = scenarioUnit.passages.length;
                        scenarioUnit.passages.push(passage);
                    }
                }
                break;
            }
        }
    }

    const segmentsStart = lines.findIndex((l) => /^segments:\s*$/.test(l));
    if (segmentsStart >= 0) {
        let i = segmentsStart + 1;
        while (i < lines.length) {
            if (/^[a-z_]+:/.test(lines[i]) && !/^\s/.test(lines[i])) {
                break;
            }
            const typeMatch = lines[i].match(/^\s*-?\s*type:\s*(\w+)\s*$/);
            if (!typeMatch) {
                i += 1;
                continue;
            }
            const segType = typeMatch[1];
            let segId = null;
            let segEnd = i + 1;
            while (segEnd < lines.length) {
                if (/^\s*-?\s*type:\s*\w+\s*$/.test(lines[segEnd]) && segEnd > i) {
                    break;
                }
                if (/^[a-z_]+:/.test(lines[segEnd]) && !/^\s/.test(lines[segEnd])) {
                    break;
                }
                const idMatch = lines[segEnd].match(/^\s*id:\s*(.+)$/);
                if (idMatch) {
                    segId = idMatch[1].trim();
                }
                segEnd += 1;
            }
            const segmentLines = lines.slice(i, segEnd);
            if (segId && (segType === "decision" || segType === "narrative")) {
                const unitId = `${scenarioId}/${segId}`;
                const segmentUnit = {
                    unitType: "scenario_segment",
                    unitId,
                    anchor: makeScenarioAnchor(scenarioId, segId),
                    passages: [],
                };
                for (let j = 0; j < segmentLines.length; j += 1) {
                    const sl = segmentLines[j];
                    if (/^\s*prompt:/.test(sl) && segType === "decision") {
                        const indentMatch = sl.match(/^(\s*)/);
                        const baseIndent = indentMatch ? indentMatch[1].length : 0;
                        const { value } = readScalar(segmentLines, j, baseIndent);
                        if (value) {
                            const p = buildPassage(`segments[${segId}].prompt`, segmentUnit.passages.length, value);
                            if (p) {
                                p.sourceOrdinal = segmentUnit.passages.length;
                                segmentUnit.passages.push(p);
                            }
                        }
                    }
                    if (/^\s*text:/.test(sl) && segType === "narrative") {
                        const indentMatch = sl.match(/^(\s*)/);
                        const baseIndent = indentMatch ? indentMatch[1].length : 0;
                        const { value } = readScalar(segmentLines, j, baseIndent);
                        if (value) {
                            const p = buildPassage(`segments[${segId}].text`, segmentUnit.passages.length, value);
                            if (p) {
                                p.sourceOrdinal = segmentUnit.passages.length;
                                segmentUnit.passages.push(p);
                            }
                        }
                    }
                    if (/^\s*label:/.test(sl) && segType === "decision") {
                        const indentMatch = sl.match(/^(\s*)/);
                        const baseIndent = indentMatch ? indentMatch[1].length : 0;
                        const choiceIdx = segmentUnit.passages.filter((p) => p.fieldPath.includes(".label")).length;
                        const { value } = readScalar(segmentLines, j, baseIndent);
                        if (value) {
                            const p = buildPassage(
                                `segments[${segId}].choices[${choiceIdx}].label`,
                                segmentUnit.passages.length,
                                value
                            );
                            if (p) {
                                p.sourceOrdinal = segmentUnit.passages.length;
                                segmentUnit.passages.push(p);
                            }
                        }
                    }
                    if (/^\s*feedback:/.test(sl) && segType === "decision") {
                        const indentMatch = sl.match(/^(\s*)/);
                        const baseIndent = indentMatch ? indentMatch[1].length : 0;
                        const choiceIdx = segmentUnit.passages.filter((p) => p.fieldPath.includes(".feedback")).length;
                        const { value } = readScalar(segmentLines, j, baseIndent);
                        if (value) {
                            const p = buildPassage(
                                `segments[${segId}].choices[${choiceIdx}].feedback`,
                                segmentUnit.passages.length,
                                value
                            );
                            if (p) {
                                p.sourceOrdinal = segmentUnit.passages.length;
                                segmentUnit.passages.push(p);
                            }
                        }
                    }
                }
                if (segmentUnit.passages.length) {
                    units.push(segmentUnit);
                }
            }
            i = segEnd;
        }
    }

    return { units: units.filter((u) => u.passages.length > 0), diagnostics };
}

/**
 * Extract units from published Cognitive Priming JSON (AP-B §7.2).
 * Indexable fields only: edn label, item_label, ai sentence, summary bullets.
 */
export function extractCognitivePrimingUnits(content) {
    const diagnostics = [];
    if (typeof content !== "string" || content.includes("\uFFFD")) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    /** @type {unknown} */
    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    const record = /** @type {Record<string, unknown>} */ (parsed);
    if (record.schema_version !== 1) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    const passages = [];
    const prerequisites = record.prerequisites;
    if (prerequisites && typeof prerequisites === "object" && !Array.isArray(prerequisites)) {
        const ednRefs = Array.isArray(prerequisites.edn_references)
            ? prerequisites.edn_references
            : [];
        for (let i = 0; i < ednRefs.length; i += 1) {
            const ref = ednRefs[i];
            if (!ref || typeof ref !== "object") {
                continue;
            }
            const refObj = /** @type {Record<string, unknown>} */ (ref);
            if (isNonEmptyString(refObj.label)) {
                passages.push(
                    buildPassage(
                        `prerequisites.edn_references[${i}].label`,
                        passages.length,
                        String(refObj.label)
                    )
                );
            }
            if (isNonEmptyString(refObj.item_label)) {
                passages.push(
                    buildPassage(
                        `prerequisites.edn_references[${i}].item_label`,
                        passages.length,
                        String(refObj.item_label)
                    )
                );
            }
        }

        const aiComplements = Array.isArray(prerequisites.ai_complements)
            ? prerequisites.ai_complements
            : [];
        for (let i = 0; i < aiComplements.length; i += 1) {
            const item = aiComplements[i];
            if (!item || typeof item !== "object") {
                continue;
            }
            const sentence = /** @type {Record<string, unknown>} */ (item).sentence;
            if (isNonEmptyString(sentence)) {
                passages.push(
                    buildPassage(
                        `prerequisites.ai_complements[${i}].sentence`,
                        passages.length,
                        String(sentence)
                    )
                );
            }
        }
    }

    const summary = record.summary;
    if (summary && typeof summary === "object" && !Array.isArray(summary)) {
        const bullets = Array.isArray(summary.bullets) ? summary.bullets : [];
        for (let i = 0; i < bullets.length; i += 1) {
            if (isNonEmptyString(bullets[i])) {
                passages.push(
                    buildPassage(`summary.bullets[${i}]`, passages.length, String(bullets[i]))
                );
            }
        }
    }

    const normalizedPassages = passages.filter(Boolean).map((p, idx) => ({
        ...p,
        sourceOrdinal: idx,
    }));

    if (!normalizedPassages.length) {
        diagnostics.push(DIAGNOSTICS.DOC_INVALID);
        return { units: [], diagnostics };
    }

    return {
        units: [
            {
                unitType: "cognitive_priming",
                unitId: "cognitive-priming",
                anchor: makeViewEntryAnchor(),
                passages: normalizedPassages,
            },
        ],
        diagnostics,
    };
}

/**
 * Extract manifest alt visual entry.
 */
export function extractManifestAltUnit(visual) {
    if (!visual || !visual.alt || !String(visual.alt).trim()) {
        return { units: [], diagnostics: [] };
    }
    const visualId = visual.id || visual.visualId;
    const elementId = visual.element || visual.elementId || visualId;
    const passage = buildPassage("alt", 0, visual.alt);
    if (!passage) {
        return { units: [], diagnostics: [] };
    }
    return {
        units: [
            {
                unitType: "figure_alt",
                unitId: visualId || elementId,
                anchor: makeManifestAltAnchor(elementId, visualId),
                passages: [passage],
            },
        ],
        diagnostics: [],
    };
}

export {
    makeElementAnchor,
    makeCollegeAnchor,
    makeQuestionAnchor,
    makeScenarioAnchor,
    makeManifestAltAnchor,
    makeViewEntryAnchor,
};
