/**
 * Safe JSONL parser — skips malformed lines instead of throwing
 */
export function parseJsonlSafe<T>(content: string): T[] {
  return content
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as T];
      } catch {
        return [];
      }
    });
}
