/**
 * Shared helpers for Ulysses state-machine tests.
 *
 * Validator-bound Ulysses requires every plan to attach two notebook code
 * cells. We materialise a single in-process NotebookHandler with a "decider"
 * cell whose verdict is driven entirely by `observed.outcome`:
 *
 *   observed = { outcome: "pass" }  → validator pass → assessment "expected"
 *   observed = { outcome: "fail" }  → validator fail → assessment "unexpected-unfavorable"
 *
 * The same cell is reused as both primary and recovery validator unless a
 * test explicitly wants different bindings.
 */

import { NotebookHandler } from "../../notebook/index.js";
import type { ValidatorRef } from "../types.js";

const DECIDER_CELL_SOURCE = `
import { observed, pass, fail } from "./tb-validate.js";
const data = observed();
if (data && data.outcome === "pass") {
  pass("decider: pass requested", data);
} else {
  fail("decider: fail requested", data);
}
`.trim();

export interface UlyssesTestEnv {
  notebookHandler: NotebookHandler;
  notebookId: string;
  passFailCellId: string;
  /** Validator ref pointing at the decider cell. */
  decider: ValidatorRef;
}

export async function makeUlyssesTestEnv(): Promise<UlyssesTestEnv> {
  const notebookHandler = new NotebookHandler();
  await notebookHandler.init();

  const created = await notebookHandler.handleCreateNotebook({
    title: "ulysses-test-validators",
    language: "javascript",
  });
  const notebookId = created.notebook.id as string;

  const cellResult = await notebookHandler.handleAddCell({
    notebookId,
    cellType: "code",
    content: DECIDER_CELL_SOURCE,
    filename: "decider.js",
  });
  const passFailCellId = cellResult.cell.id as string;

  return {
    notebookHandler,
    notebookId,
    passFailCellId,
    decider: { notebookId, cellId: passFailCellId },
  };
}

/** Convenience: an `observed` shape that the decider treats as pass. */
export const PASS_OBSERVED = { outcome: "pass" } as const;

/** Convenience: an `observed` shape that the decider treats as fail. */
export const FAIL_OBSERVED = { outcome: "fail" } as const;
