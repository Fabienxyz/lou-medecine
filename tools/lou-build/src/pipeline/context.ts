import type { StageId, StageResult } from "./stage.js";

export type PipelineCommand = "validate" | "build";

export interface BuildContext {
  /** Resolved absolute path to the chapter package directory. */
  chapterDir: string;
  command: PipelineCommand;
  /** Accumulated stage results, keyed by stage id. */
  results: Map<StageId, StageResult>;
  /** When true, generation stages may write artefacts (build mode). */
  mutate: boolean;
  /** Cross-stage working set populated by stage implementations. */
  workspace: Record<string, unknown>;
}

export function createContext(
  chapterDir: string,
  command: PipelineCommand,
): BuildContext {
  return {
    chapterDir,
    command,
    results: new Map(),
    mutate: command === "build",
    workspace: {},
  };
}
