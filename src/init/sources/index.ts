/**
 * Index Source Exports
 *
 * Provides different storage backends for session exports in local-first mode.
 */

// Filesystem source (primary for local deployment)
export {
  FileSystemIndexSource,
  type FileSystemIndexSourceOptions,
} from "./filesystem.js";

// In-memory source (for testing)
export { InMemoryIndexSource } from "./in-memory.js";
