import type { InitParams, InitState, ResourceContent, SessionIndex } from "./types.js";

/** Full handler implementation removed with index-builder; server uses null handler + fallbacks. */
export interface IInitHandler {
  handle(params: InitParams): ResourceContent;
  getState(params: InitParams): InitState;
  validate(params: InitParams): true | string;
  getIndex(): SessionIndex;
  refresh?(): Promise<IInitHandler>;
}
