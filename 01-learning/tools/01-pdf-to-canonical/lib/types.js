/**
 * Shared typedefs (JSDoc only — no runtime exports required).
 *
 * @typedef {{
 *   str: string,
 *   x: number,
 *   y: number,
 *   width: number,
 *   height: number,
 *   fontSize: number,
 *   fontName: string,
 *   hasEOL?: boolean,
 * }} TextItem
 *
 * @typedef {{
 *   pageNumber: number,
 *   width: number,
 *   height: number,
 *   items: TextItem[],
 * }} ExtractedPage
 *
 * @typedef {{
 *   page: number,
 *   y: number,
 *   x: number,
 *   text: string,
 *   fontSize: number,
 *   avgFontSize?: number,
 *   fonts?: string[],
 *   pageWidth: number,
 *   pageHeight: number,
 * }} NormalizedLine
 *
 * @typedef {{
 *   page: number,
 *   pageEnd?: number,
 *   yTop: number,
 *   yBottom: number,
 *   colCenters?: number[],
 *   segments?: { page: number, yTop: number, yBottom: number }[],
 *   grid?: string[][],
 *   segmentGrids?: string[][][],
 *   markdown: string,
 *   kind: 'pipe' | 'fallback',
 *   confidence?: number,
 * }} DetectedTable
 */

export {};
