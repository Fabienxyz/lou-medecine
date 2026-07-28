/**
 * Stage A — Acquisition (legacy reference implementation).
 *
 * Tool 01/02 produce acquisition artefacts upstream (contrat 03).
 * This module is the legacy JS reference; migrated implementation lives in
 * src/stages/acquisition.ts.
 */

/**
 * @param {{ chapterDir: string, command: string, mutate: boolean }} ctx
 * @returns {{ ok: boolean, errors: string[], data?: unknown }}
 */
export function runAcquisition(ctx) {
  void ctx;
  return {
    ok: true,
    errors: [],
    data: {
      note: "Acquisition is handled upstream by Tool 01/02 (contrat 03).",
    },
  };
}
